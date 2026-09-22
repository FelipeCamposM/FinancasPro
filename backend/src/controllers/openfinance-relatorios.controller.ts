import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { FATURA_SQL } from "./openfinance.controller";

const MESES_SERIE = 12;

/**
 * Dashboard: saldos e faturas ao vivo, gasto do mês por categoria, série
 * entrada x saída e o que as assinaturas devem cobrar no próximo mês.
 */
export const dashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const [contas, cartoes, porCategoria, serie, totaisMes, assinaturas, pendentes] =
      await Promise.all([
        pool.query(
          `SELECT id, nome, apelido, cor, saldo, moeda
             FROM of_contas WHERE user_id = $1 ORDER BY nome`,
          [userId],
        ),
        // A fatura vem da soma da competência corrente, não do balance da
        // Pluggy — aquilo é o limite usado total. Ver FATURA_SQL.
        pool.query(
          `WITH faturas AS (${FATURA_SQL}),
           alvo AS (
             SELECT of_cartao_id, MAX(competencia) AS competencia
               FROM faturas GROUP BY of_cartao_id
           )
           SELECT c.id, c.nome, c.apelido, c.cor, c.bandeira, c.ultimos_4_digitos,
                  c.limite, a.competencia,
                  COALESCE(f.fatura, 0)   AS fatura_atual,
                  COALESCE(f.encargos, 0) AS encargos,
                  COALESCE(c.dia_vencimento_manual, c.dia_vencimento) AS dia_vencimento,
                  COALESCE(c.dia_fechamento_manual, c.dia_fechamento) AS dia_fechamento,
                  COALESCE(c.limite, 0) - COALESCE(c.limite_usado, 0) AS limite_disponivel
             FROM of_cartoes c
             LEFT JOIN alvo    a ON a.of_cartao_id = c.id
             LEFT JOIN faturas f ON f.of_cartao_id = c.id AND f.competencia = a.competencia
            WHERE c.user_id = $1 ORDER BY c.nome`,
          [userId],
        ),
        pool.query(
          `SELECT COALESCE(c.nome, 'Sem categoria') AS categoria,
                  COALESCE(c.cor, '#94A3B8')       AS cor,
                  SUM(g.valor)::numeric(14,2)      AS total,
                  COUNT(*)::int                    AS lancamentos
             FROM of_gastos g
             LEFT JOIN categorias c ON c.id = g.categoria_id
            WHERE g.user_id = $1
              AND g.competencia = DATE_TRUNC('month', CURRENT_DATE)::date
            GROUP BY c.nome, c.cor
            ORDER BY total DESC`,
          [userId],
        ),
        // Série de meses gerada por generate_series para que mês sem
        // movimento apareça zerado em vez de sumir do gráfico.
        pool.query(
          `WITH meses AS (
             SELECT generate_series(
               DATE_TRUNC('month', CURRENT_DATE) - ($2 - 1) * INTERVAL '1 month',
               DATE_TRUNC('month', CURRENT_DATE),
               INTERVAL '1 month'
             )::date AS mes
           )
           SELECT m.mes,
                  COALESCE((SELECT SUM(valor) FROM of_gastos g
                             WHERE g.user_id = $1 AND g.competencia = m.mes), 0)::numeric(14,2) AS saidas,
                  COALESCE((SELECT SUM(valor) FROM of_renda r
                             WHERE r.user_id = $1
                               AND DATE_TRUNC('month', r.data_renda) = m.mes), 0)::numeric(14,2) AS entradas
             FROM meses m
            ORDER BY m.mes`,
          [userId, MESES_SERIE],
        ),
        pool.query(
          `SELECT
             COALESCE((SELECT SUM(valor) FROM of_gastos
                        WHERE user_id = $1
                          AND competencia = DATE_TRUNC('month', CURRENT_DATE)::date), 0)::numeric(14,2) AS gastos_mes,
             COALESCE((SELECT SUM(valor) FROM of_renda
                        WHERE user_id = $1
                          AND data_renda >= DATE_TRUNC('month', CURRENT_DATE)), 0)::numeric(14,2) AS renda_mes`,
          [userId],
        ),
        pool.query(
          // Cada número olha um status diferente: o total mensal é a previsão,
          // então só pode somar o que foi confirmado.
          `SELECT COUNT(*) FILTER (WHERE status = 'confirmada')::int AS confirmadas,
                  COUNT(*) FILTER (WHERE status = 'sugerida')::int   AS sugestoes,
                  COALESCE(SUM(COALESCE(valor_ultimo, valor_medio))
                           FILTER (WHERE status = 'confirmada'), 0)::numeric(14,2) AS total_mensal
             FROM of_assinaturas
            WHERE user_id = $1 AND status IN ('confirmada', 'sugerida')`,
          [userId],
        ),
        pool.query(
          `SELECT COUNT(*)::int AS total FROM of_transacoes
            WHERE user_id = $1 AND destino = 'a_classificar'`,
          [userId],
        ),
      ]);

    res.json({
      data: {
        contas: contas.rows,
        cartoes: cartoes.rows,
        saldo_total: contas.rows.reduce((s, c) => s + Number(c.saldo ?? 0), 0),
        fatura_total: cartoes.rows.reduce(
          (s, c) => s + Number(c.fatura_atual ?? 0),
          0,
        ),
        encargos_total: cartoes.rows.reduce(
          (s, c) => s + Number(c.encargos ?? 0),
          0,
        ),
        gastos_mes: Number(totaisMes.rows[0].gastos_mes),
        renda_mes: Number(totaisMes.rows[0].renda_mes),
        por_categoria: porCategoria.rows,
        serie_mensal: serie.rows,
        assinaturas: assinaturas.rows[0],
        a_classificar: pendentes.rows[0].total,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Relatórios: comparação mês a mês por categoria, ranking de estabelecimentos
 * e fluxo de caixa com acumulado. `de`/`ate` delimitam o período.
 */
export const relatorios = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { de, ate } = req.query as Record<string, string | undefined>;
    const params = [userId, de ?? null, ate ?? null];

    const periodoGastos =
      "g.user_id = $1 AND ($2::date IS NULL OR g.data_gasto >= $2::date) AND ($3::date IS NULL OR g.data_gasto <= $3::date)";
    const periodoRenda =
      "r.user_id = $1 AND ($2::date IS NULL OR r.data_renda >= $2::date) AND ($3::date IS NULL OR r.data_renda <= $3::date)";

    const [porMes, ranking, fluxo] = await Promise.all([
      pool.query(
        `SELECT g.competencia AS mes,
                COALESCE(c.nome, 'Sem categoria') AS categoria,
                COALESCE(c.cor, '#94A3B8')       AS cor,
                SUM(g.valor)::numeric(14,2)      AS total
           FROM of_gastos g
           LEFT JOIN categorias c ON c.id = g.categoria_id
          WHERE ${periodoGastos}
          GROUP BY g.competencia, c.nome, c.cor
          ORDER BY mes, total DESC`,
        params,
      ),
      // merchant_nome só vem preenchido em parte das transações, então o
      // fallback é a descrição normalizada — senão o ranking ficaria vazio.
      pool.query(
        `SELECT COALESCE(t.merchant_nome, of_padrao_descricao(g.descricao)) AS estabelecimento,
                SUM(g.valor)::numeric(14,2) AS total,
                COUNT(*)::int               AS vezes,
                MAX(g.data_gasto)           AS ultima
           FROM of_gastos g
           JOIN of_transacoes t ON t.id = g.of_transacao_id
          WHERE ${periodoGastos}
          GROUP BY estabelecimento
         HAVING COALESCE(t.merchant_nome, of_padrao_descricao(g.descricao)) <> ''
          ORDER BY total DESC
          LIMIT 50`,
        params,
      ),
      pool.query(
        `WITH movimento AS (
           SELECT g.competencia AS mes,
                  SUM(g.valor) AS saidas, 0::numeric AS entradas
             FROM of_gastos g WHERE ${periodoGastos}
            GROUP BY g.competencia
           UNION ALL
           SELECT DATE_TRUNC('month', r.data_renda)::date AS mes,
                  0::numeric AS saidas, SUM(r.valor) AS entradas
             FROM of_renda r WHERE ${periodoRenda}
            GROUP BY mes
         )
         SELECT mes,
                SUM(entradas)::numeric(14,2)              AS entradas,
                SUM(saidas)::numeric(14,2)                AS saidas,
                (SUM(entradas) - SUM(saidas))::numeric(14,2) AS resultado,
                SUM(SUM(entradas) - SUM(saidas)) OVER (ORDER BY mes)::numeric(14,2) AS acumulado
           FROM movimento
          GROUP BY mes
          ORDER BY mes`,
        params,
      ),
    ]);

    res.json({
      data: {
        por_mes_categoria: porMes.rows,
        ranking_estabelecimentos: ranking.rows,
        fluxo_caixa: fluxo.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

const csvEscape = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Exportação do período em CSV (separador ';' para o Excel em pt-BR). */
export const exportarCsv = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { de, ate } = req.query as Record<string, string | undefined>;
    const { rows } = await pool.query(
      `SELECT g.data_gasto, g.descricao, g.valor,
              COALESCE(c.nome, 'Sem categoria') AS categoria,
              COALESCE(ct.apelido, ct.nome, co.apelido, co.nome) AS origem,
              a.nome AS assinatura
         FROM of_gastos g
         LEFT JOIN categorias     c  ON c.id  = g.categoria_id
         LEFT JOIN of_cartoes     ct ON ct.id = g.of_cartao_id
         LEFT JOIN of_contas      co ON co.id = g.of_conta_id
         LEFT JOIN of_assinaturas a  ON a.id  = g.of_assinatura_id
        WHERE g.user_id = $1
          AND ($2::date IS NULL OR g.data_gasto >= $2::date)
          AND ($3::date IS NULL OR g.data_gasto <= $3::date)
        ORDER BY g.data_gasto DESC`,
      [req.user!.userId, de ?? null, ate ?? null],
    );

    const cabecalho = "Data;Descricao;Valor;Categoria;Origem;Assinatura";
    const linhas = rows.map((r) =>
      [
        r.data_gasto.toISOString().slice(0, 10),
        r.descricao,
        Number(r.valor).toFixed(2).replace(".", ","),
        r.categoria,
        r.origem,
        r.assinatura,
      ]
        .map(csvEscape)
        .join(";"),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="openfinance-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    // BOM: sem ele o Excel abre os acentos errados.
    res.send("﻿" + [cabecalho, ...linhas].join("\n"));
  } catch (err) {
    next(err);
  }
};
