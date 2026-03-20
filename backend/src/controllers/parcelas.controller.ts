import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import { UpdateParcelaInput } from "../schemas/parcelas.schema";

export const listParcelasByGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;
    const gastoId = req.params.gastoId;

    // Verifica se o gasto pertence ao usuário
    const { rows: gasto } = await pool.query(
      "SELECT id FROM gastos WHERE id = $1 AND user_id = $2",
      [gastoId, userId],
    );
    if (!gasto[0]) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int AS count FROM parcelas WHERE gasto_id = $1",
        [gastoId],
      ),
      pool.query(
        "SELECT * FROM parcelas WHERE gasto_id = $1 ORDER BY numero_parcela LIMIT $2 OFFSET $3",
        [gastoId, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const listMinhasParcelas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;

    const filters: string[] = ["g.user_id = $1"];
    const values: unknown[] = [userId];
    let idx = 2;
    if (req.query.status) {
      filters.push(`p.status = $${idx++}`);
      values.push(req.query.status);
    }
    if (req.query.data_inicio) {
      filters.push(`p.data_vencimento >= $${idx++}`);
      values.push(req.query.data_inicio);
    }
    if (req.query.data_fim) {
      filters.push(`p.data_vencimento <= $${idx++}`);
      values.push(req.query.data_fim);
    }
    if (req.query.cartao_id) {
      filters.push(`g.cartao_id = $${idx++}`);
      values.push(req.query.cartao_id);
    }

    const where = filters.join(" AND ");

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM parcelas p JOIN gastos g ON g.id = p.gasto_id WHERE ${where}`,
        values,
      ),
      pool.query(
        `SELECT p.*, g.descricao AS gasto_descricao, g.valor_total AS gasto_valor_total,
                ct.apelido AS cartao_apelido, ct.bandeira AS cartao_bandeira, ct.cor AS cartao_cor
         FROM parcelas p
         JOIN gastos g ON g.id = p.gasto_id
         LEFT JOIN cartoes ct ON ct.id = g.cartao_id
         WHERE ${where}
         ORDER BY p.data_vencimento ASC
         LIMIT $${idx++} OFFSET $${idx}`,
        [...values, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const updateParcela = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { rows: existing } = await pool.query(
      "SELECT p.id FROM parcelas p JOIN gastos g ON g.id = p.gasto_id WHERE p.id = $1 AND g.user_id = $2",
      [req.params.id, userId],
    );
    if (!existing[0]) {
      res.status(404).json({ error: "Parcela não encontrada" });
      return;
    }

    const body: UpdateParcelaInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (body.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(body.status);
    }
    if (body.data_pagamento !== undefined) {
      fields.push(`data_pagamento = $${idx++}`);
      values.push(body.data_pagamento ?? null);
    }
    if (!fields.length) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE parcelas SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
