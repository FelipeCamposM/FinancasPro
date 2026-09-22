import { Request, Response, NextFunction } from "express";
import { PoolClient } from "pg";
import pool from "../config/database";

// Mínimo de meses distintos com a mesma cobrança para virar sugestão. Com 2 a
// taxa de falso positivo fica alta (compra repetida por acaso); com 3 uma
// assinatura nova demora um trimestre para aparecer. 3 é o meio-termo.
const MIN_OCORRENCIAS = 3;
// Tolerância de variação de valor entre as cobranças. Assinatura em dólar
// oscila com o câmbio, então comparar valor exato perderia a maioria.
const VARIACAO_MAX = 0.25;

/**
 * Procura cobranças de cartão que se repetem em meses distintos com valor
 * parecido e registra cada padrão novo como assinatura 'sugerida'.
 *
 * Padrões já confirmados ou ignorados pelo usuário não são tocados: o
 * ON CONFLICT só atualiza as métricas, nunca o status.
 */
export const detectarAssinaturas = async (
  db: PoolClient,
  userId: string,
): Promise<number> => {
  const { rows } = await db.query(
    `WITH cobrancas AS (
       SELECT
         of_padrao_descricao(g.descricao) AS padrao,
         g.descricao,
         g.valor,
         g.categoria_id,
         g.of_cartao_id,
         g.data_gasto,
         DATE_TRUNC('month', g.data_gasto) AS mes
       FROM of_gastos g
       -- Compra em 3x de valor fixo tem a cara de assinatura mas não é: o
       -- parcelamento acaba. Sem este filtro, AIRBNB, AMAZON e SHOPEE
       -- entravam como sugestão.
       WHERE g.user_id = $1 AND g.of_cartao_id IS NOT NULL
         AND COALESCE(g.total_parcelas, 1) <= 1
     ),
     agrupado AS (
       SELECT
         padrao,
         COUNT(DISTINCT mes)::int          AS meses,
         AVG(valor)::numeric(14,2)         AS valor_medio,
         MIN(valor)                        AS valor_min,
         MAX(valor)                        AS valor_max,
         MAX(data_gasto)                   AS ultima,
         (ARRAY_AGG(descricao ORDER BY data_gasto DESC))[1]     AS nome,
         (ARRAY_AGG(valor ORDER BY data_gasto DESC))[1]         AS valor_ultimo,
         (ARRAY_AGG(categoria_id ORDER BY data_gasto DESC))[1]  AS categoria_id,
         (ARRAY_AGG(of_cartao_id ORDER BY data_gasto DESC))[1]  AS of_cartao_id
       FROM cobrancas
       WHERE padrao <> ''
       GROUP BY padrao
     )
     INSERT INTO of_assinaturas (
       user_id, nome, padrao_descricao, valor_medio, valor_ultimo,
       dia_cobranca, categoria_id, of_cartao_id, ocorrencias, ultima_cobranca
     )
     SELECT $1, nome, padrao, valor_medio, valor_ultimo,
            EXTRACT(DAY FROM ultima)::int, categoria_id, of_cartao_id,
            meses, ultima
       FROM agrupado
      WHERE meses >= $2
        AND valor_medio > 0
        AND valor_max <= valor_min * (1 + $3::numeric)
     ON CONFLICT (user_id, padrao_descricao) DO UPDATE SET
       valor_medio     = EXCLUDED.valor_medio,
       valor_ultimo    = EXCLUDED.valor_ultimo,
       ocorrencias     = EXCLUDED.ocorrencias,
       ultima_cobranca = EXCLUDED.ultima_cobranca,
       dia_cobranca    = EXCLUDED.dia_cobranca,
       updated_at      = NOW()
     RETURNING (xmax = 0) AS nova`,
    [userId, MIN_OCORRENCIAS, VARIACAO_MAX],
  );

  await vincularGastos(db, userId);
  return rows.filter((r) => r.nova).length;
};

/** Liga os gastos já importados à assinatura confirmada correspondente. */
const vincularGastos = async (
  db: PoolClient,
  userId: string,
): Promise<void> => {
  await db.query(
    `UPDATE of_gastos g
        SET of_assinatura_id = a.id
       FROM of_assinaturas a
      WHERE a.user_id = $1
        AND g.user_id = $1
        AND a.status = 'confirmada'
        AND g.of_assinatura_id IS DISTINCT FROM a.id
        AND of_padrao_descricao(g.descricao) = a.padrao_descricao`,
    [userId],
  );
};

export const listAssinaturas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const { rows } = await pool.query(
      `SELECT a.*, c.nome AS categoria_nome, c.cor AS categoria_cor,
              ct.nome AS cartao_nome, ct.apelido AS cartao_apelido
         FROM of_assinaturas a
         LEFT JOIN categorias  c  ON c.id  = a.categoria_id
         LEFT JOIN of_cartoes  ct ON ct.id = a.of_cartao_id
        WHERE a.user_id = $1
          AND ($2::text IS NULL OR a.status = $2::of_status_assinatura_enum)
        ORDER BY a.status, a.valor_medio DESC`,
      [req.user!.userId, status ?? null],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

export const updateAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const db = await pool.connect();
  try {
    const { status, nome, categoria_id, dia_cobranca } = req.body;
    const { rows } = await db.query(
      `UPDATE of_assinaturas SET
         status       = COALESCE($3::of_status_assinatura_enum, status),
         nome         = COALESCE($4, nome),
         categoria_id = COALESCE($5, categoria_id),
         dia_cobranca = COALESCE($6, dia_cobranca)
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        req.params.id,
        req.user!.userId,
        status ?? null,
        nome ?? null,
        categoria_id ?? null,
        dia_cobranca ?? null,
      ],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Assinatura não encontrada" });
      return;
    }
    if (status === "confirmada") await vincularGastos(db, req.user!.userId);
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  } finally {
    db.release();
  }
};

export const deleteAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM of_assinaturas WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Assinatura não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * Previsão do próximo mês: cada assinatura confirmada projeta uma cobrança na
 * mesma data do mês seguinte, pelo último valor conhecido (mais fiel que a
 * média quando o preço subiu).
 */
export const previsaoProximoMes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.nome, a.dia_cobranca,
              COALESCE(a.valor_ultimo, a.valor_medio) AS valor_previsto,
              a.valor_medio, a.ultima_cobranca,
              c.nome AS categoria_nome, c.cor AS categoria_cor,
              ct.apelido AS cartao_apelido, ct.nome AS cartao_nome,
              -- LEAST evita 31/02: dia 31 numa competência de 30 dias cai no
              -- último dia do mês
              (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
               + (LEAST(
                    COALESCE(a.dia_cobranca, 1),
                    EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 month') - INTERVAL '1 day'))::int
                  ) - 1) * INTERVAL '1 day')::date AS data_prevista
         FROM of_assinaturas a
         LEFT JOIN categorias c  ON c.id  = a.categoria_id
         LEFT JOIN of_cartoes ct ON ct.id = a.of_cartao_id
        WHERE a.user_id = $1 AND a.status = 'confirmada'
        ORDER BY data_prevista`,
      [req.user!.userId],
    );

    const total = rows.reduce((s, r) => s + Number(r.valor_previsto), 0);
    res.json({ data: { itens: rows, total: Number(total.toFixed(2)) } });
  } catch (err) {
    next(err);
  }
};
