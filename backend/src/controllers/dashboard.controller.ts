import { Request, Response, NextFunction } from "express";
import pool from "../config/database";

/**
 * GET /api/dashboard/summary?mes=2026-03-01
 * Resumo do mês: total de renda, total de gastos, saldo, parcelas pendentes
 */
export const summary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mes =
      (req.query.mes as string) ?? new Date().toISOString().slice(0, 7) + "-01";

    const [rendaRes, gastosRes, parcelasRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(valor), 0)::float AS total
         FROM renda
         WHERE user_id = $1
           AND DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $2::date)`,
        [userId, mes],
      ),
      pool.query(
        `SELECT COALESCE(SUM(valor_total), 0)::float AS total
         FROM gastos
         WHERE user_id = $1
           AND status != 'cancelado'
           AND DATE_TRUNC('month', data_gasto) = DATE_TRUNC('month', $2::date)`,
        [userId, mes],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(p.valor_parcela), 0)::float AS total
         FROM parcelas p
         JOIN gastos g ON g.id = p.gasto_id
         WHERE g.user_id = $1
           AND p.status = 'pendente'
           AND p.data_vencimento >= DATE_TRUNC('month', $2::date)
           AND p.data_vencimento < DATE_TRUNC('month', $2::date) + INTERVAL '1 month'`,
        [userId, mes],
      ),
    ]);

    const totalRenda = rendaRes.rows[0].total;
    const totalGastos = gastosRes.rows[0].total;

    res.json({
      mes,
      total_renda: totalRenda,
      total_gastos: totalGastos,
      saldo: totalRenda - totalGastos,
      parcelas_pendentes: {
        count: parcelasRes.rows[0].count,
        total: parcelasRes.rows[0].total,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/gastos-por-categoria?mes=2026-03-01
 */
export const gastosPorCategoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mes =
      (req.query.mes as string) ?? new Date().toISOString().slice(0, 7) + "-01";

    const { rows } = await pool.query(
      `SELECT
         COALESCE(c.nome, 'Sem Categoria') AS categoria,
         COALESCE(c.cor, '#9CA3AF')        AS cor,
         COALESCE(c.icone, '📦')           AS icone,
         COUNT(g.id)::int                  AS quantidade,
         SUM(g.valor_total)::float         AS total
       FROM gastos g
       LEFT JOIN categorias c ON c.id = g.categoria_id
       WHERE g.user_id = $1
         AND g.status != 'cancelado'
         AND DATE_TRUNC('month', g.data_gasto) = DATE_TRUNC('month', $2::date)
       GROUP BY c.nome, c.cor, c.icone
       ORDER BY total DESC`,
      [userId, mes],
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/renda-vs-gastos?meses=6
 * Evolução mensal dos últimos N meses
 */
export const rendaVsGastos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const meses = Math.min(
      24,
      Math.max(1, parseInt(req.query.meses as string) || 6),
    );

    const { rows } = await pool.query(
      `SELECT
         TO_CHAR(mes, 'YYYY-MM')                                                AS mes,
         COALESCE(SUM(CASE WHEN tipo = 'renda' THEN valor ELSE 0 END), 0)::float AS total_renda,
         COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END), 0)::float AS total_gastos
       FROM (
         SELECT DATE_TRUNC('month', mes_referencia) AS mes, valor, 'renda' AS tipo
         FROM renda WHERE user_id = $1
         UNION ALL
         SELECT DATE_TRUNC('month', data_gasto) AS mes, valor_total AS valor, 'gasto' AS tipo
         FROM gastos WHERE user_id = $1 AND status != 'cancelado'
       ) t
       WHERE mes >= DATE_TRUNC('month', NOW()) - ($2 - 1) * INTERVAL '1 month'
       GROUP BY mes
       ORDER BY mes ASC`,
      [userId, meses],
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/gastos-por-forma-pagamento?mes=2026-03-01
 */
export const gastosPorFormaPagamento = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mes =
      (req.query.mes as string) ?? new Date().toISOString().slice(0, 7) + "-01";

    const { rows } = await pool.query(
      `SELECT forma_pagamento, COUNT(*)::int AS quantidade, SUM(valor_total)::float AS total
       FROM gastos
       WHERE user_id = $1
         AND status != 'cancelado'
         AND DATE_TRUNC('month', data_gasto) = DATE_TRUNC('month', $2::date)
       GROUP BY forma_pagamento
       ORDER BY total DESC`,
      [userId, mes],
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};
