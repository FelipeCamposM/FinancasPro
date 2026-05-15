import { Request, Response, NextFunction } from "express";
import pool from "../config/database";

function faturaRange(
  diaFechamento: number,
  mesRef: string,
): { inicio: string; fim: string } {
  const [year, month] = mesRef.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const diaEfetivo = Math.min(diaFechamento, lastDay);
  const fim = new Date(year, month - 1, diaEfetivo);
  const inicio = new Date(fim);
  inicio.setMonth(inicio.getMonth() - 1);
  inicio.setDate(inicio.getDate() + 1);
  return {
    inicio: inicio.toISOString().slice(0, 10),
    fim: fim.toISOString().slice(0, 10),
  };
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
