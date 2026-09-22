import { Request, Response, NextFunction } from "express";
import pool from "../config/database";

/**
 * Projeção das parcelas que ainda não foram lançadas.
 *
 * A Pluggy só devolve a parcela depois que ela entra numa fatura, então uma
 * compra em 10x recém-feita aparece com 1 lançamento, não 10. As restantes são
 * calculadas: a última parcela conhecida define a competência de partida e cada
 * parcela seguinte cai um mês depois.
 *
 * A chave da compra é descrição + data da compra + total de parcelas. O valor
 * não entra na chave de propósito: a mesma compra pode ter parcelas de 65,25 e
 * 65,24 por arredondamento, e agrupar por valor as separaria em duas compras.
 *
 * Usa $1 = user_id.
 */
export const PROJECAO_PARCELAS_SQL = `
  WITH ultima AS (
    SELECT DISTINCT ON (t.descricao, t.purchase_date, t.total_parcelas)
           t.user_id,
           t.of_cartao_id,
           t.descricao,
           t.purchase_date,
           t.total_parcelas,
           t.numero_parcela AS ultima_parcela,
           t.competencia    AS ultima_competencia,
           t.valor,
           t.categoria_id
      FROM of_transacoes t
     WHERE t.user_id = $1
       AND t.tipo = 'debito'
       AND t.total_parcelas > 1
       AND t.numero_parcela IS NOT NULL
       AND t.destino <> 'ignorado'
     ORDER BY t.descricao, t.purchase_date, t.total_parcelas,
              t.numero_parcela DESC
  )
  SELECT u.user_id,
         u.of_cartao_id,
         u.descricao,
         u.purchase_date,
         u.total_parcelas,
         u.categoria_id,
         u.valor,
         n AS numero_parcela,
         (u.ultima_competencia
          + ((n - u.ultima_parcela) * INTERVAL '1 month'))::date AS competencia
    FROM ultima u
    CROSS JOIN LATERAL generate_series(u.ultima_parcela + 1, u.total_parcelas) AS n
`;

/**
 * Compras parceladas em andamento, com o que já caiu e o que falta.
 * Alimenta o card do dashboard e o modal de detalhe.
 */
export const listParcelamentos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const { rows } = await pool.query(
      `WITH reais AS (
         SELECT t.descricao, t.purchase_date, t.total_parcelas,
                t.numero_parcela, t.competencia, t.valor,
                t.of_cartao_id, t.categoria_id,
                FALSE AS projecao
           FROM of_transacoes t
          WHERE t.user_id = $1
            AND t.tipo = 'debito'
            AND t.total_parcelas > 1
            AND t.numero_parcela IS NOT NULL
            AND t.destino <> 'ignorado'
       ),
       projetadas AS (
         SELECT p.descricao, p.purchase_date, p.total_parcelas,
                p.numero_parcela, p.competencia, p.valor,
                p.of_cartao_id, p.categoria_id,
                TRUE AS projecao
           FROM (${PROJECAO_PARCELAS_SQL}) p
       ),
       todas AS (
         SELECT * FROM reais UNION ALL SELECT * FROM projetadas
       )
       SELECT t.descricao,
              t.purchase_date,
              t.total_parcelas,
              COUNT(*) FILTER (WHERE NOT t.projecao)::int      AS parcelas_lancadas,
              COUNT(*) FILTER (WHERE t.projecao)::int          AS parcelas_restantes,
              SUM(t.valor)::numeric(14,2)                      AS valor_total,
              SUM(t.valor) FILTER (WHERE t.projecao)::numeric(14,2) AS falta_pagar,
              MAX(t.valor)::numeric(14,2)                      AS valor_parcela,
              MIN(t.competencia) FILTER (WHERE t.projecao)     AS proxima_competencia,
              MAX(t.competencia)                               AS ultima_competencia,
              MAX(ct.apelido)                                  AS cartao_apelido,
              MAX(ct.nome)                                     AS cartao_nome,
              MAX(cat.nome)                                    AS categoria_nome,
              MAX(cat.cor)                                     AS categoria_cor,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'numero_parcela', t.numero_parcela,
                  'competencia',    t.competencia,
                  'valor',          t.valor,
                  'projecao',       t.projecao
                ) ORDER BY t.numero_parcela
              ) AS parcelas
         FROM todas t
         LEFT JOIN of_cartoes ct  ON ct.id  = t.of_cartao_id
         LEFT JOIN categorias cat ON cat.id = t.categoria_id
        GROUP BY t.descricao, t.purchase_date, t.total_parcelas
        ORDER BY (COUNT(*) FILTER (WHERE t.projecao)) DESC, t.purchase_date DESC`,
      [userId],
    );

    const emAndamento = rows.filter((r) => r.parcelas_restantes > 0);

    // Comprometido por mês: soma de uma parcela de cada compra que ainda tem
    // parcela a cair. É quanto do orçamento do próximo mês já está preso.
    const comprometidoMensal = emAndamento.reduce(
      (s, r) => s + Number(r.valor_parcela),
      0,
    );
    const faltaPagar = emAndamento.reduce(
      (s, r) => s + Number(r.falta_pagar ?? 0),
      0,
    );

    res.json({
      data: {
        itens: rows,
        em_andamento: emAndamento.length,
        comprometido_mensal: Number(comprometidoMensal.toFixed(2)),
        falta_pagar: Number(faltaPagar.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};
