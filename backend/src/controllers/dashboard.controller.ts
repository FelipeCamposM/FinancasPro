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
    const mesRaw =
      (req.query.mes as string) ?? new Date().toISOString().slice(0, 7);
    const mes = mesRaw.length === 7 ? mesRaw + "-01" : mesRaw;

    const [rendaRes, gastosRes, parcelasRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(valor), 0)::float AS total
         FROM renda r
         WHERE r.user_id = $1
           AND (
             r.renda_origem_id IS NOT NULL
             OR r.recorrente = false
             OR NOT EXISTS (
               SELECT 1 FROM renda inst
               WHERE inst.renda_origem_id = r.id
                 AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $2::date)
             )
           )
           AND (
             -- Rendas diretas do mês (pontuais e instâncias lançadas)
             DATE_TRUNC('month', r.mes_referencia) = DATE_TRUNC('month', $2::date)
             OR (
               -- Templates recorrentes ativos neste mês, sem instância já lançada
               r.recorrente = true
               AND r.renda_origem_id IS NULL
               AND DATE_TRUNC('month', r.mes_referencia) <= DATE_TRUNC('month', $2::date)
               AND (r.data_fim_recorrencia IS NULL OR r.data_fim_recorrencia >= DATE_TRUNC('month', $2::date))
               AND NOT EXISTS (
                 SELECT 1 FROM renda inst
                 WHERE inst.renda_origem_id = r.id
                   AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $2::date)
               )
             )
           )`,
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
    const mesRaw =
      (req.query.mes as string) ?? new Date().toISOString().slice(0, 7);
    const mes = mesRaw.length === 7 ? mesRaw + "-01" : mesRaw;

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
         FROM renda
         WHERE user_id = $1
           AND (
             renda_origem_id IS NOT NULL
             OR recorrente = false
             OR NOT EXISTS (
               SELECT 1 FROM renda inst
               WHERE inst.renda_origem_id = renda.id
                 AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', renda.mes_referencia)
             )
           )
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
    const mesRaw =
      (req.query.mes as string) ?? new Date().toISOString().slice(0, 7);
    const mes = mesRaw.length === 7 ? mesRaw + "-01" : mesRaw;

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

/**
 * GET /api/dashboard/relatorio-mensal?mes=YYYY-MM
 * Análise completa de um mês: resumo, top categorias, top gastos, formas de pagamento
 */
export const relatorioMensal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mesRaw =
      (req.query.mes as string) ?? new Date().toISOString().slice(0, 7);
    const mes = mesRaw.length === 7 ? mesRaw + "-01" : mesRaw;

    const [rendaRes, gastosRes, parcelasRes, catRes, fmRes, topRes] =
      await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(valor), 0)::float AS total
           FROM renda r
           WHERE r.user_id = $1
             AND (
               r.renda_origem_id IS NOT NULL
               OR r.recorrente = false
               OR NOT EXISTS (
                 SELECT 1 FROM renda inst
                 WHERE inst.renda_origem_id = r.id
                   AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $2::date)
               )
             )
             AND (
               DATE_TRUNC('month', r.mes_referencia) = DATE_TRUNC('month', $2::date)
               OR (
                 r.recorrente = true
                 AND r.renda_origem_id IS NULL
                 AND DATE_TRUNC('month', r.mes_referencia) <= DATE_TRUNC('month', $2::date)
                 AND (r.data_fim_recorrencia IS NULL OR r.data_fim_recorrencia >= DATE_TRUNC('month', $2::date))
                 AND NOT EXISTS (
                   SELECT 1 FROM renda inst
                   WHERE inst.renda_origem_id = r.id
                     AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $2::date)
                 )
               )
             )`,
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
        pool.query(
          `SELECT
             COALESCE(c.nome, 'Sem Categoria') AS nome,
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
        ),
        pool.query(
          `SELECT forma_pagamento, COUNT(*)::int AS quantidade, SUM(valor_total)::float AS total
           FROM gastos
           WHERE user_id = $1
             AND status != 'cancelado'
             AND DATE_TRUNC('month', data_gasto) = DATE_TRUNC('month', $2::date)
           GROUP BY forma_pagamento
           ORDER BY total DESC`,
          [userId, mes],
        ),
        pool.query(
          `SELECT g.descricao, g.valor_total::float, g.data_gasto,
                  COALESCE(c.nome, 'Sem Categoria') AS categoria_nome,
                  COALESCE(c.cor, '#9CA3AF')        AS categoria_cor
           FROM gastos g
           LEFT JOIN categorias c ON c.id = g.categoria_id
           WHERE g.user_id = $1
             AND g.status != 'cancelado'
             AND DATE_TRUNC('month', g.data_gasto) = DATE_TRUNC('month', $2::date)
           ORDER BY g.valor_total DESC
           LIMIT 5`,
          [userId, mes],
        ),
      ]);

    const totalRenda = rendaRes.rows[0].total;
    const totalGastos = gastosRes.rows[0].total;
    const saldo = totalRenda - totalGastos;

    res.json({
      mes,
      resumo: {
        total_renda: totalRenda,
        total_gastos: totalGastos,
        saldo,
        taxa_poupanca: totalRenda > 0 ? (saldo / totalRenda) * 100 : null,
        parcelas_pendentes: {
          count: parcelasRes.rows[0].count,
          total: parcelasRes.rows[0].total,
        },
      },
      categorias: catRes.rows,
      formas_pagamento: fmRes.rows,
      top_gastos: topRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/projecoes?meses=6
 * Projeção dos próximos N meses: parcelas pendentes + assinaturas + renda recorrente
 */
export const projecoes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const n = Math.min(12, Math.max(1, parseInt(req.query.meses as string) || 6));

    const [parcelasRes, assinaturasRes, rendaRes] = await Promise.all([
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', p.data_vencimento), 'YYYY-MM') AS mes,
                COALESCE(SUM(p.valor_parcela), 0)::float AS total_parcelas,
                COUNT(p.id)::int AS quantidade_parcelas
         FROM parcelas p
         JOIN gastos g ON g.id = p.gasto_id
         WHERE g.user_id = $1
           AND p.status = 'pendente'
           AND p.data_vencimento >= DATE_TRUNC('month', CURRENT_DATE)
           AND p.data_vencimento < DATE_TRUNC('month', CURRENT_DATE) + ($2 * INTERVAL '1 month')
         GROUP BY mes
         ORDER BY mes ASC`,
        [userId, n],
      ),
      pool.query(
        `SELECT COALESCE(SUM(valor), 0)::float AS total
         FROM assinaturas
         WHERE user_id = $1 AND ativa = true`,
        [userId],
      ),
      pool.query(
        `SELECT COALESCE(SUM(valor), 0)::float AS total
         FROM renda
         WHERE user_id = $1
           AND recorrente = true
           AND renda_origem_id IS NULL
           AND (data_fim_recorrencia IS NULL OR data_fim_recorrencia >= CURRENT_DATE)`,
        [userId],
      ),
    ]);

    const assinaturasMensais: number = assinaturasRes.rows[0].total;
    const rendaMensalRecorrente: number = rendaRes.rows[0].total;

    // Build a map of parcelas by month
    const parcelasMap = new Map<string, { total_parcelas: number; quantidade_parcelas: number }>();
    for (const row of parcelasRes.rows) {
      parcelasMap.set(row.mes, {
        total_parcelas: row.total_parcelas,
        quantidade_parcelas: row.quantidade_parcelas,
      });
    }

    // Generate N months starting from current month
    const meses = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const parcelas = parcelasMap.get(mesStr) ?? { total_parcelas: 0, quantidade_parcelas: 0 };
      const totalGastosProjetados = parcelas.total_parcelas + assinaturasMensais;
      meses.push({
        mes: mesStr,
        renda_esperada: rendaMensalRecorrente,
        total_parcelas: parcelas.total_parcelas,
        quantidade_parcelas: parcelas.quantidade_parcelas,
        total_assinaturas: assinaturasMensais,
        total_gastos_projetados: totalGastosProjetados,
        saldo_projetado: rendaMensalRecorrente - totalGastosProjetados,
      });
    }

    res.json({
      resumo: {
        renda_mensal_recorrente: rendaMensalRecorrente,
        assinaturas_mensais: assinaturasMensais,
      },
      meses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/relatorio-anual?ano=YYYY
 * Relatório consolidado do ano: resumo, meses, categorias, formas de pagamento
 */
export const relatorioAnual = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const ano = parseInt(req.query.ano as string) || new Date().getFullYear();

    const [mesRes, catRes, fmRes] = await Promise.all([
      pool.query(
        `SELECT
           TO_CHAR(mes, 'YYYY-MM') AS mes,
           COALESCE(SUM(CASE WHEN tipo = 'renda' THEN valor ELSE 0 END), 0)::float AS total_renda,
           COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END), 0)::float AS total_gastos
         FROM (
           SELECT DATE_TRUNC('month', mes_referencia) AS mes, valor, 'renda' AS tipo
           FROM renda
           WHERE user_id = $1
             AND (
               renda_origem_id IS NOT NULL
               OR recorrente = false
               OR NOT EXISTS (
                 SELECT 1 FROM renda inst
                 WHERE inst.renda_origem_id = renda.id
                   AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', renda.mes_referencia)
               )
             )
           UNION ALL
           SELECT DATE_TRUNC('month', data_gasto) AS mes, valor_total AS valor, 'gasto' AS tipo
           FROM gastos WHERE user_id = $1 AND status != 'cancelado'
         ) t
         WHERE EXTRACT(YEAR FROM mes) = $2
         GROUP BY mes
         ORDER BY mes ASC`,
        [userId, ano],
      ),
      pool.query(
        `SELECT
           COALESCE(c.nome, 'Sem Categoria') AS nome,
           COALESCE(c.cor, '#9CA3AF')        AS cor,
           COALESCE(c.icone, '📦')           AS icone,
           COUNT(g.id)::int                  AS quantidade,
           SUM(g.valor_total)::float         AS total
         FROM gastos g
         LEFT JOIN categorias c ON c.id = g.categoria_id
         WHERE g.user_id = $1
           AND g.status != 'cancelado'
           AND EXTRACT(YEAR FROM g.data_gasto) = $2
         GROUP BY c.nome, c.cor, c.icone
         ORDER BY total DESC`,
        [userId, ano],
      ),
      pool.query(
        `SELECT forma_pagamento, COUNT(*)::int AS quantidade, SUM(valor_total)::float AS total
         FROM gastos
         WHERE user_id = $1
           AND status != 'cancelado'
           AND EXTRACT(YEAR FROM data_gasto) = $2
         GROUP BY forma_pagamento
         ORDER BY total DESC`,
        [userId, ano],
      ),
    ]);

    const meses = mesRes.rows.map((row) => ({
      ...row,
      saldo: row.total_renda - row.total_gastos,
    }));

    const totalRenda = meses.reduce((s: number, m: { total_renda: number }) => s + m.total_renda, 0);
    const totalGastos = meses.reduce((s: number, m: { total_gastos: number }) => s + m.total_gastos, 0);
    const saldo = totalRenda - totalGastos;

    res.json({
      ano,
      resumo: {
        total_renda: totalRenda,
        total_gastos: totalGastos,
        saldo,
        taxa_poupanca: totalRenda > 0 ? (saldo / totalRenda) * 100 : null,
      },
      meses,
      categorias: catRes.rows,
      formas_pagamento: fmRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/period-summary?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
 * Total de gastos e renda em um período arbitrário (ou sem filtro para todos os registros).
 */
export const periodSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mesRaw = req.query.mes as string | undefined;
    const dataInicio = req.query.data_inicio as string | undefined;
    const dataFim = req.query.data_fim as string | undefined;

    let gastosRes: { rows: { total: number }[] };
    let rendaRes: { rows: { total: number }[] };

    if (mesRaw) {
      // Modo mês: usa a mesma lógica do endpoint summary (mes_referencia + deduplicação de recorrentes)
      const mes = mesRaw.length === 7 ? mesRaw + "-01" : mesRaw;
      [gastosRes, rendaRes] = await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(valor_total), 0)::float AS total
           FROM gastos
           WHERE user_id = $1
             AND status != 'cancelado'
             AND DATE_TRUNC('month', data_gasto) = DATE_TRUNC('month', $2::date)`,
          [userId, mes],
        ),
        pool.query(
          `SELECT COALESCE(SUM(valor), 0)::float AS total
           FROM renda r
           WHERE r.user_id = $1
             AND r.renda_origem_id IS NULL
             AND (
               DATE_TRUNC('month', r.mes_referencia) = DATE_TRUNC('month', $2::date)
               OR (
                 r.recorrente = true
                 AND DATE_TRUNC('month', r.mes_referencia) <= DATE_TRUNC('month', $2::date)
                 AND (r.data_fim_recorrencia IS NULL OR r.data_fim_recorrencia >= DATE_TRUNC('month', $2::date))
                 AND NOT EXISTS (
                   SELECT 1 FROM renda inst
                   WHERE inst.renda_origem_id = r.id
                     AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $2::date)
                 )
               )
             )`,
          [userId, mes],
        ),
      ]);
    } else {
      // Modo período customizado: filtra por data_gasto / data_recebimento
      const gastoFilters: string[] = ["user_id = $1", "status != 'cancelado'"];
      const rendaFilters: string[] = [
        "user_id = $1",
        "renda_origem_id IS NULL",
      ];
      const gastoValues: unknown[] = [userId];
      const rendaValues: unknown[] = [userId];
      let gastoIdx = 2;
      let rendaIdx = 2;

      if (dataInicio) {
        gastoFilters.push(`data_gasto >= $${gastoIdx++}`);
        gastoValues.push(dataInicio);
        rendaFilters.push(`data_recebimento >= $${rendaIdx++}`);
        rendaValues.push(dataInicio);
      }
      if (dataFim) {
        gastoFilters.push(`data_gasto <= $${gastoIdx++}`);
        gastoValues.push(dataFim);
        rendaFilters.push(`data_recebimento <= $${rendaIdx++}`);
        rendaValues.push(dataFim);
      }

      [gastosRes, rendaRes] = await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(valor_total), 0)::float AS total
           FROM gastos
           WHERE ${gastoFilters.join(" AND ")}`,
          gastoValues,
        ),
        pool.query(
          `SELECT COALESCE(SUM(valor), 0)::float AS total
           FROM renda
           WHERE ${rendaFilters.join(" AND ")}`,
          rendaValues,
        ),
      ]);
    }

    const totalGastos = gastosRes.rows[0].total;
    const totalRenda = rendaRes.rows[0].total;

    res.json({
      total_gastos: totalGastos,
      total_renda: totalRenda,
      diferenca: totalRenda - totalGastos,
    });
  } catch (err) {
    next(err);
  }
};
