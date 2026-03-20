import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import { CreateGastoInput, UpdateGastoInput } from "../schemas/gastos.schema";

export const listGastos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;

    // Filtros opcionais via query string
    const filters: string[] = ["g.user_id = $1"];
    const values: unknown[] = [userId];
    let idx = 2;

    if (req.query.status) {
      filters.push(`g.status = $${idx++}`);
      values.push(req.query.status);
    }
    if (req.query.categoria_id) {
      filters.push(`g.categoria_id = $${idx++}`);
      values.push(Number(req.query.categoria_id));
    }
    if (req.query.cartao_id) {
      filters.push(`g.cartao_id = $${idx++}`);
      values.push(req.query.cartao_id);
    }
    if (req.query.forma_pagamento) {
      filters.push(`g.forma_pagamento = $${idx++}`);
      values.push(req.query.forma_pagamento);
    }
    if (req.query.data_inicio) {
      filters.push(`g.data_gasto >= $${idx++}`);
      values.push(req.query.data_inicio);
    }
    if (req.query.data_fim) {
      filters.push(`g.data_gasto <= $${idx++}`);
      values.push(req.query.data_fim);
    }

    const where = filters.join(" AND ");

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM gastos g WHERE ${where}`,
        values,
      ),
      pool.query(
        `SELECT g.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone,
                ct.apelido AS cartao_apelido, ct.bandeira AS cartao_bandeira, ct.cor AS cartao_cor
         FROM gastos g
         LEFT JOIN categorias c ON c.id = g.categoria_id
         LEFT JOIN cartoes ct ON ct.id = g.cartao_id
         WHERE ${where}
         ORDER BY g.data_gasto DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        [...values, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone,
              ct.apelido AS cartao_apelido, ct.bandeira AS cartao_bandeira, ct.cor AS cartao_cor
       FROM gastos g
       LEFT JOIN categorias c ON c.id = g.categoria_id
       LEFT JOIN cartoes ct ON ct.id = g.cartao_id
       WHERE g.id = $1 AND g.user_id = $2`,
      [req.params.id, req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body: CreateGastoInput = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `INSERT INTO gastos
          (user_id, descricao, valor_total, categoria_id, forma_pagamento, cartao_id,
           tipo_pagamento, quantidade_parcelas, recorrente, frequencia_recorrencia,
           data_fim_recorrencia, data_gasto, observacoes, status, gasto_origem_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          userId,
          body.descricao,
          body.valor_total,
          body.categoria_id ?? null,
          body.forma_pagamento,
          body.cartao_id ?? null,
          body.tipo_pagamento,
          body.quantidade_parcelas,
          body.recorrente,
          body.frequencia_recorrencia ?? null,
          body.data_fim_recorrencia ?? null,
          body.data_gasto,
          body.observacoes ?? null,
          body.status,
          body.gasto_origem_id ?? null,
        ],
      );

      const gasto = rows[0];

      // Gerar parcelas automaticamente quando parcelado
      if (body.tipo_pagamento === "parcelado" && body.quantidade_parcelas > 1) {
        const valorParcela = parseFloat(
          (body.valor_total / body.quantidade_parcelas).toFixed(2),
        );
        const baseDate = new Date(body.data_gasto);
        for (let i = 1; i <= body.quantidade_parcelas; i++) {
          const venc = new Date(baseDate);
          venc.setMonth(venc.getMonth() + i);
          await client.query(
            "INSERT INTO parcelas (gasto_id, numero_parcela, valor_parcela, data_vencimento) VALUES ($1,$2,$3,$4)",
            [gasto.id, i, valorParcela, venc.toISOString().split("T")[0]],
          );
        }
      }

      await client.query("COMMIT");
      res.status(201).json(gasto);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

export const updateGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM gastos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!existing[0]) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }

    const body: UpdateGastoInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const updatable: string[] = [
      "descricao",
      "valor_total",
      "categoria_id",
      "forma_pagamento",
      "cartao_id",
      "recorrente",
      "frequencia_recorrencia",
      "data_fim_recorrencia",
      "data_gasto",
      "observacoes",
      "status",
    ];
    const typedBody = body as Record<string, unknown>;
    for (const key of updatable) {
      if (key in typedBody) {
        fields.push(`${key} = $${idx++}`);
        values.push(typedBody[key] ?? null);
      }
    }
    if (!fields.length) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE gastos SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM gastos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
