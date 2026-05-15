import { Request, Response, NextFunction } from "express";
import pool from "../config/database";

const RENDA_SQL = `
  SELECT COALESCE(SUM(valor), 0)::float AS total
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
    )
`;

/**
 * GET /api/relatorios/mensal?mes=YYYY-MM&categoria_id=N&cartao_id=UUID&forma_pagamento=pix
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

    const categoriaId = req.query.categoria_id
      ? Number(req.query.categoria_id)
      : null;
    const cartaoId = (req.query.cartao_id as string) || null;
    const formaPagamento = (req.query.forma_pagamento as string) || null;

    const gastoFilters = [
      "g.user_id = $1",
      "g.status != 'cancelado'",
      "DATE_TRUNC('month', g.data_gasto) = DATE_TRUNC('month', $2::date)",
    ];
    const gastoValues: unknown[] = [userId, mes];
    let idx = 3;

    if (categoriaId) {
      gastoFilters.push(`g.categoria_id = $${idx++}`);
      gastoValues.push(categoriaId);
    }
    if (cartaoId) {
      gastoFilters.push(`g.cartao_id = $${idx++}`);
      gastoValues.push(cartaoId);
    }
    if (formaPagamento) {
      gastoFilters.push(`g.forma_pagamento = $${idx++}`);
      gastoValues.push(formaPagamento);
    }

    const w = gastoFilters.join(" AND ");

    const [rendaRes, gastosRes, catRes, fmRes, topRes, evolucaoRes] =
      await Promise.all([
        pool.query(RENDA_SQL, [userId, mes]),

        pool.query(
          `SELECT COALESCE(SUM(g.valor_total), 0)::float AS total,
                  COUNT(g.id)::int AS quantidade
           FROM gastos g
           WHERE ${w}`,
          gastoValues,
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
           WHERE ${w}
           GROUP BY c.nome, c.cor, c.icone
           ORDER BY total DESC`,
          gastoValues,
        ),

        pool.query(
          `SELECT g.forma_pagamento, COUNT(g.id)::int AS quantidade, SUM(g.valor_total)::float AS total
           FROM gastos g
           WHERE ${w}
           GROUP BY g.forma_pagamento
           ORDER BY total DESC`,
          gastoValues,
        ),

        pool.query(
          `SELECT g.descricao, g.valor_total::float, g.data_gasto,
                  COALESCE(c.nome, 'Sem Categoria') AS categoria_nome,
                  COALESCE(c.cor, '#9CA3AF')        AS categoria_cor
           FROM gastos g
           LEFT JOIN categorias c ON c.id = g.categoria_id
           WHERE ${w}
           ORDER BY g.valor_total DESC
           LIMIT 5`,
          gastoValues,
        ),

        pool.query(
          `SELECT
             DATE(g.data_gasto)          AS dia,
             COUNT(g.id)::int            AS quantidade,
             SUM(g.valor_total)::float   AS total
           FROM gastos g
           WHERE ${w}
           GROUP BY dia
           ORDER BY dia ASC`,
          gastoValues,
        ),
      ]);

    const totalRenda: number = rendaRes.rows[0].total;
    const totalGastos: number = gastosRes.rows[0].total;
    const qtdTransacoes: number = gastosRes.rows[0].quantidade;

    const mesDate = new Date(mes);
    const ano = mesDate.getFullYear();
    const mesNum = mesDate.getMonth();
    const totalDiasMes = new Date(ano, mesNum + 1, 0).getDate();
    const hoje = new Date();
    const ehMesAtual =
      hoje.getFullYear() === ano && hoje.getMonth() === mesNum;
    const diasPassados = ehMesAtual ? hoje.getDate() : totalDiasMes;
    const mediaDiaria = diasPassados > 0 ? totalGastos / diasPassados : 0;
    const projecaoMensal = mediaDiaria * totalDiasMes;

    let acumulado = 0;
    const evolucaoDiaria = evolucaoRes.rows.map((row) => {
      acumulado += row.total;
      return {
        dia: row.dia,
        quantidade: row.quantidade,
        total: row.total,
        acumulado,
      };
    });

    const maiorCategoria = catRes.rows[0] ?? null;

    res.json({
      mes: mesRaw.length === 7 ? mesRaw : mesRaw.slice(0, 7),
      resumo: {
        total_renda: totalRenda,
        total_gastos: totalGastos,
        saldo: totalRenda - totalGastos,
        percentual_comprometido:
          totalRenda > 0 ? (totalGastos / totalRenda) * 100 : null,
        media_diaria: mediaDiaria,
        projecao_mensal: projecaoMensal,
        quantidade_transacoes: qtdTransacoes,
        ticket_medio: qtdTransacoes > 0 ? totalGastos / qtdTransacoes : 0,
        maior_gasto: topRes.rows[0] ?? null,
        maior_categoria: maiorCategoria
          ? {
              nome: maiorCategoria.nome,
              valor: maiorCategoria.total,
              percentual:
                totalGastos > 0
                  ? (maiorCategoria.total / totalGastos) * 100
                  : 0,
            }
          : null,
      },
      categorias: catRes.rows,
      formas_pagamento: fmRes.rows,
      top_gastos: topRes.rows,
      evolucao_diaria: evolucaoDiaria,
    });
  } catch (err) {
    next(err);
  }
};
