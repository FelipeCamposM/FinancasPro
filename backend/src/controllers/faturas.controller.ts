import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { getPreferenciasUsuario } from "../utils/preferencias";

/** YYYY-MM-DD no fuso local — toISOString() jogaria a data um dia para trás em UTC-3. */
const isoLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Dia do mês respeitando meses curtos (fechamento 31 em fevereiro vira 28/29). */
const diaEfetivoNoMes = (ano: number, mes1a12: number, dia: number): number =>
  Math.min(dia, new Date(ano, mes1a12, 0).getDate());

function faturaRange(
  diaFechamento: number,
  mesRef: string,
): { inicio: string; fim: string } {
  const [year, month] = mesRef.split("-").map(Number);
  const fim = new Date(year, month - 1, diaEfetivoNoMes(year, month, diaFechamento));
  const inicio = new Date(fim);
  inicio.setMonth(inicio.getMonth() - 1);
  inicio.setDate(inicio.getDate() + 1);
  return { inicio: isoLocal(inicio), fim: isoLocal(fim) };
}

async function getCartaoOrFail(
  cartaoId: string,
  userId: string,
  res: Response,
): Promise<{ id: string; apelido: string; dia_fechamento: number } | null> {
  const { rows } = await pool.query(
    "SELECT id, apelido, COALESCE(dia_fechamento, 1) AS dia_fechamento FROM cartoes WHERE id = $1 AND user_id = $2",
    [cartaoId, userId],
  );
  if (!rows[0]) {
    res.status(404).json({ error: "Cartão não encontrado" });
    return null;
  }
  return rows[0] as { id: string; apelido: string; dia_fechamento: number };
}

export const getFaturas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cartaoId = req.params.id;

    const cartao = await getCartaoOrFail(cartaoId, userId, res);
    if (!cartao) return;

    const diaFechamento = cartao.dia_fechamento;

    // Todos os gastos do cartão — determina a qual fatura cada data_gasto pertence
    const { rows: meses } = await pool.query(
      `
      SELECT DISTINCT
        CASE WHEN EXTRACT(DAY FROM g.data_gasto) <= $3
             THEN TO_CHAR(g.data_gasto, 'YYYY-MM')
             ELSE TO_CHAR(g.data_gasto + INTERVAL '1 month', 'YYYY-MM')
        END AS mes_fatura
      FROM gastos g
      WHERE g.cartao_id = $1 AND g.user_id = $2
        AND g.forma_pagamento = 'cartao_credito'
        AND (
          g.assinatura_id IS NULL
          OR g.status = 'pago'
          OR (g.data_gasto <= CURRENT_DATE AND EXISTS (
            SELECT 1 FROM assinaturas a WHERE a.id = g.assinatura_id AND a.ativa = TRUE
          ))
        )
      ORDER BY mes_fatura DESC
      `,
      [cartaoId, userId, diaFechamento],
    );

    const faturas: unknown[] = [];
    for (const row of meses) {
      const { inicio, fim } = faturaRange(diaFechamento, row.mes_fatura as string);

      const { rows: totals } = await pool.query(
        `
        SELECT
          COALESCE(SUM(g.valor_total), 0)::numeric                                       AS total,
          COALESCE(SUM(CASE WHEN g.status = 'pendente' THEN g.valor_total ELSE 0 END), 0)::numeric AS pendente,
          COUNT(*)::int                                                                   AS itens_count
        FROM gastos g
        WHERE g.cartao_id = $1 AND g.user_id = $2
          AND g.forma_pagamento = 'cartao_credito'
          AND g.data_gasto BETWEEN $3 AND $4
          AND (
            g.assinatura_id IS NULL
            OR g.status = 'pago'
            OR (g.data_gasto <= CURRENT_DATE AND EXISTS (
              SELECT 1 FROM assinaturas a WHERE a.id = g.assinatura_id AND a.ativa = TRUE
            ))
          )
        `,
        [cartaoId, userId, inicio, fim],
      );

      faturas.push({
        mes: row.mes_fatura,
        total: Number(totals[0].total),
        pendente: Number(totals[0].pendente),
        itens_count: totals[0].itens_count,
      });
    }

    res.json({ data: faturas });
  } catch (err) {
    next(err);
  }
};

export const getFaturaDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id: cartaoId, mes } = req.params;

    if (!/^\d{4}-\d{2}$/.test(mes)) {
      res.status(400).json({ error: "Formato de mês inválido. Use YYYY-MM" });
      return;
    }

    const cartao = await getCartaoOrFail(cartaoId, userId, res);
    if (!cartao) return;

    const { inicio, fim } = faturaRange(cartao.dia_fechamento, mes);

    const { rows } = await pool.query(
      `
      SELECT
        g.id AS gasto_id,
        CASE WHEN g.tipo_pagamento = 'parcelado' THEN 'parcela' ELSE 'gasto' END AS tipo,
        g.numero_parcela AS parcela_id,
        CASE WHEN g.tipo_pagamento = 'parcelado'
             THEN g.descricao || ' ' || g.numero_parcela || '/' || g.quantidade_parcelas
             ELSE g.descricao
        END AS descricao,
        g.valor_total AS valor,
        g.data_gasto  AS data,
        c.nome AS categoria_nome,
        c.cor  AS categoria_cor,
        g.status
      FROM gastos g
      LEFT JOIN categorias c ON c.id = g.categoria_id
      WHERE g.cartao_id = $1 AND g.user_id = $2
        AND g.forma_pagamento = 'cartao_credito'
        AND g.data_gasto BETWEEN $3 AND $4
        AND (
          g.assinatura_id IS NULL
          OR g.status = 'pago'
          OR (g.data_gasto <= CURRENT_DATE AND EXISTS (
            SELECT 1 FROM assinaturas a WHERE a.id = g.assinatura_id AND a.ativa = TRUE
          ))
        )
      ORDER BY g.data_gasto, g.created_at
`,
      [cartaoId, userId, inicio, fim],
    );

    const itens = rows.map((r) => ({ ...r, valor: Number(r.valor) }));
    const total = itens.reduce((s, i) => s + i.valor, 0);
    const pendente = itens
      .filter((i) => i.status === "pendente")
      .reduce((s, i) => s + i.valor, 0);

    res.json({
      mes,
      cartao: {
        id: cartaoId,
        apelido: cartao.apelido,
        dia_fechamento: cartao.dia_fechamento,
      },
      periodo: { inicio, fim },
      total: Number(total.toFixed(2)),
      pendente: Number(pendente.toFixed(2)),
      itens,
    });
  } catch (err) {
    next(err);
  }
};

export const pagarFatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { id: cartaoId, mes } = req.params;

    if (!/^\d{4}-\d{2}$/.test(mes)) {
      res.status(400).json({ error: "Formato de mês inválido. Use YYYY-MM" });
      return;
    }

    const { rows: cardRows } = await pool.query(
      "SELECT id, COALESCE(dia_fechamento, 1) AS dia_fechamento FROM cartoes WHERE id = $1 AND user_id = $2",
      [cartaoId, userId],
    );
    if (!cardRows[0]) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const { inicio, fim } = faturaRange(cardRows[0].dia_fechamento as number, mes);

    await client.query("BEGIN");

    const { rowCount } = await client.query(
      `
      UPDATE gastos SET status = 'pago', updated_at = NOW()
      WHERE cartao_id = $1 AND user_id = $2
        AND forma_pagamento = 'cartao_credito'
        AND data_gasto BETWEEN $3 AND $4
        AND status = 'pendente'
        AND (assinatura_id IS NULL OR data_gasto <= CURRENT_DATE)
      `,
      [cartaoId, userId, inicio, fim],
    );

    await client.query("COMMIT");
    res.json({ atualizados: rowCount ?? 0 });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/cartoes/faturas-status
 * Diz qual mês a interface deve abrir e quais faturas já fechadas seguem sem
 * pagamento. Enquanto a fatura que fecha no mês corrente (a dos gastos do mês
 * anterior) não fechou, o mês sugerido continua sendo o anterior.
 */
export const getFaturasStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const { rows: cartoes } = await pool.query(
      `SELECT id, apelido, cor, bandeira, ultimos_4_digitos,
              dia_fechamento, dia_vencimento
       FROM cartoes
       WHERE user_id = $1
         AND tipo IN ('credito', 'credito_debito')
         AND COALESCE(ativo, true) = true
         AND dia_fechamento IS NOT NULL`,
      [userId],
    );

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const ano = hoje.getFullYear();
    const mes1 = hoje.getMonth() + 1;
    const mesAtualRef = `${ano}-${String(mes1).padStart(2, "0")}`;
    const anteriorDate = new Date(ano, hoje.getMonth() - 1, 1);
    const mesAnteriorRef = `${anteriorDate.getFullYear()}-${String(anteriorDate.getMonth() + 1).padStart(2, "0")}`;

    const prefs = await getPreferenciasUsuario(userId);
    const diasAntes = prefs.alerta_fatura_dias_antes ?? 0;

    let aguardandoFechamento = false;
    const pendentes: unknown[] = [];

    /** Totais em aberto de uma fatura (período fechado por dia de fechamento). */
    const totaisFatura = async (cartaoId: string, inicio: string, fim: string) => {
      const { rows } = await pool.query(
        `SELECT
           COALESCE(SUM(g.valor_total), 0)::float AS total,
           COALESCE(SUM(CASE WHEN g.status = 'pendente' THEN g.valor_total ELSE 0 END), 0)::float AS pendente,
           COUNT(*)::int AS itens_count
         FROM gastos g
         WHERE g.cartao_id = $1 AND g.user_id = $2
           AND g.forma_pagamento = 'cartao_credito'
           AND g.data_gasto BETWEEN $3 AND $4
           AND (
             g.assinatura_id IS NULL
             OR g.status = 'pago'
             OR (g.data_gasto <= CURRENT_DATE AND EXISTS (
               SELECT 1 FROM assinaturas a WHERE a.id = g.assinatura_id AND a.ativa = TRUE
             ))
           )`,
        [cartaoId, userId, inicio, fim],
      );
      return rows[0] as { total: number; pendente: number; itens_count: number };
    };

    for (const c of cartoes) {
      const diaFechamento = Number(c.dia_fechamento);
      const diaVencimento = Number(c.dia_vencimento ?? diaFechamento);
      const fechamentoEsteMes = new Date(
        ano,
        hoje.getMonth(),
        diaEfetivoNoMes(ano, mes1, diaFechamento),
      );
      const jaFechou = hoje > fechamentoEsteMes;
      if (!jaFechou) aguardandoFechamento = true;

      const diasAteFechar = Math.round(
        (fechamentoEsteMes.getTime() - hoje.getTime()) / 86400000,
      );

      /** Vencimento: mesmo mês do fechamento quando cai depois dele, senão no mês seguinte. */
      const vencimentoDe = (mesFatura: string) => {
        const [anoFat, mesFat] = mesFatura.split("-").map(Number);
        const mesVenc = diaVencimento > diaFechamento ? mesFat : mesFat + 1;
        return new Date(
          anoFat,
          mesVenc - 1,
          diaEfetivoNoMes(anoFat, mesVenc, diaVencimento),
        );
      };

      const montar = async (mesFatura: string, fechada: boolean) => {
        const { inicio, fim } = faturaRange(diaFechamento, mesFatura);
        const totals = await totaisFatura(c.id, inicio, fim);
        const pendente = Number(totals.pendente);
        if (pendente <= 0) return;

        const vencimento = vencimentoDe(mesFatura);
        const diasParaVencer = Math.round(
          (vencimento.getTime() - hoje.getTime()) / 86400000,
        );

        pendentes.push({
          cartao_id: c.id,
          apelido: c.apelido,
          cor: c.cor,
          bandeira: c.bandeira,
          ultimos_4_digitos: c.ultimos_4_digitos,
          mes: mesFatura,
          /** false = fatura ainda aberta, avisada por antecedência */
          fechada,
          dias_ate_fechar: diasAteFechar,
          total: Number(totals.total),
          pendente,
          itens_count: totals.itens_count,
          fechamento: fim,
          vencimento: isoLocal(vencimento),
          dias_para_vencer: diasParaVencer,
          vencida: fechada && diasParaVencer < 0,
        });
      };

      // Última fatura já fechada deste cartão
      await montar(jaFechou ? mesAtualRef : mesAnteriorRef, true);

      // Aviso antecipado: fatura ainda aberta prestes a fechar
      if (!jaFechou && diasAntes > 0 && diasAteFechar <= diasAntes) {
        await montar(mesAtualRef, false);
      }
    }

    res.json({
      data: {
        mes_sugerido: aguardandoFechamento ? mesAnteriorRef : mesAtualRef,
        aguardando_fechamento: aguardandoFechamento,
        pendentes,
      },
    });
  } catch (err) {
    next(err);
  }
};
