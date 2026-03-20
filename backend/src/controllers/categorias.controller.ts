import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import {
  CreateCategoriaInput,
  UpdateCategoriaInput,
} from "../schemas/categorias.schema";

export const listCategorias = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;
    // Retorna categorias globais (user_id IS NULL) + categorias do usuário
    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int AS count FROM categorias WHERE user_id IS NULL OR user_id = $1",
        [userId],
      ),
      pool.query(
        "SELECT * FROM categorias WHERE user_id IS NULL OR user_id = $1 ORDER BY tipo, nome LIMIT $2 OFFSET $3",
        [userId, limit, offset],
      ),
    ]);
    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getCategoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      "SELECT * FROM categorias WHERE id = $1 AND (user_id IS NULL OR user_id = $2)",
      [req.params.id, userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Categoria não encontrada" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createCategoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { nome, cor, icone, tipo }: CreateCategoriaInput = req.body;
    const { rows } = await pool.query(
      "INSERT INTO categorias (user_id, nome, cor, icone, tipo) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [userId, nome, cor ?? null, icone ?? null, tipo],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateCategoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    // Somente categorias do próprio usuário podem ser editadas
    const { rows: existing } = await pool.query(
      "SELECT * FROM categorias WHERE id = $1 AND user_id = $2",
      [req.params.id, userId],
    );
    if (!existing[0]) {
      res
        .status(404)
        .json({ error: "Categoria não encontrada ou não editável" });
      return;
    }

    const body: UpdateCategoriaInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (body.nome !== undefined) {
      fields.push(`nome = $${idx++}`);
      values.push(body.nome);
    }
    if (body.cor !== undefined) {
      fields.push(`cor = $${idx++}`);
      values.push(body.cor);
    }
    if (body.icone !== undefined) {
      fields.push(`icone = $${idx++}`);
      values.push(body.icone);
    }
    if (body.tipo !== undefined) {
      fields.push(`tipo = $${idx++}`);
      values.push(body.tipo);
    }
    if (!fields.length) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE categorias SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteCategoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { rowCount } = await pool.query(
      "DELETE FROM categorias WHERE id = $1 AND user_id = $2",
      [req.params.id, userId],
    );
    if (!rowCount) {
      res
        .status(404)
        .json({ error: "Categoria não encontrada ou não removível" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
