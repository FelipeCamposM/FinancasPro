import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import { CreateRendaInput, UpdateRendaInput } from "../schemas/renda.schema";

export const listRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;

    const filters: string[] = ["r.user_id = $1"];
    const values: unknown[] = [userId];
    let idx = 2;

    if (req.query.tipo) {
      filters.push(`r.tipo = $${idx++}`);
      values.push(req.query.tipo);
    }
    if (req.query.categoria_id) {
      filters.push(`r.categoria_id = $${idx++}`);
      values.push(Number(req.query.categoria_id));
    }
    if (req.query.mes) {
      filters.push(
        `DATE_TRUNC('month', r.mes_referencia) = DATE_TRUNC('month', $${idx++}::date)`,
      );
      values.push(req.query.mes);
    }
    if (req.query.data_inicio) {
      filters.push(`r.data_recebimento >= $${idx++}`);
      values.push(req.query.data_inicio);
    }
    if (req.query.data_fim) {
      filters.push(`r.data_recebimento <= $${idx++}`);
      values.push(req.query.data_fim);
    }

    const where = filters.join(" AND ");

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM renda r WHERE ${where}`,
        values,
      ),
      pool.query(
        `SELECT r.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone
         FROM renda r
         LEFT JOIN categorias c ON c.id = r.categoria_id
         WHERE ${where}
         ORDER BY r.data_recebimento DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        [...values, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone
       FROM renda r
       LEFT JOIN categorias c ON c.id = r.categoria_id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Renda não encontrada" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body: CreateRendaInput = req.body;
    const { rows } = await pool.query(
      `INSERT INTO renda
        (user_id, descricao, valor, tipo, origem, categoria_id, mes_referencia,
         data_recebimento, recorrente, frequencia_recorrencia, data_fim_recorrencia, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        userId,
        body.descricao,
        body.valor,
        body.tipo,
        body.origem,
        body.categoria_id ?? null,
        body.mes_referencia,
        body.data_recebimento,
        body.recorrente,
        body.frequencia_recorrencia ?? null,
        body.data_fim_recorrencia ?? null,
        body.observacoes ?? null,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM renda WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!existing[0]) {
      res.status(404).json({ error: "Renda não encontrada" });
      return;
    }

    const body: UpdateRendaInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    const updatable: string[] = [
      "descricao",
      "valor",
      "tipo",
      "origem",
      "categoria_id",
      "mes_referencia",
      "data_recebimento",
      "recorrente",
      "frequencia_recorrencia",
      "data_fim_recorrencia",
      "observacoes",
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
      `UPDATE renda SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM renda WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Renda não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
