import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import {
  CreateCategoriaInput,
  UpdateCategoriaInput,
  ImportCategoriasInput,
} from "../schemas/categorias.schema";

export const listCategorias = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;
    const tipo = req.query.tipo as string | undefined;

    const baseWhere = tipo
      ? "user_id = $1 AND tipo = $2"
      : "user_id = $1";
    const baseValues: unknown[] = tipo ? [userId, tipo] : [userId];
    const idx = baseValues.length + 1;

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM categorias WHERE ${baseWhere}`,
        baseValues,
      ),
      pool.query(
        `SELECT * FROM categorias WHERE ${baseWhere} ORDER BY nome LIMIT $${idx} OFFSET $${idx + 1}`,
        [...baseValues, limit, offset],
      ),
    ]);
    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const listCategoriasIphone = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT id, nome, cor, icone, tipo
       FROM categorias
       WHERE user_id = $1 AND tipo = 'gasto'
       ORDER BY nome`,
      [userId],
    );
    res.json({ data: rows });
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
      "SELECT * FROM categorias WHERE id = $1 AND user_id = $2",
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

export const importCategorias = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { categorias }: ImportCategoriasInput = req.body;

    await client.query("BEGIN");
    const inserted: unknown[] = [];
    for (const cat of categorias) {
      const { rows } = await client.query(
        "INSERT INTO categorias (user_id, nome, cor, icone, tipo) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [userId, cat.nome, cat.cor ?? null, cat.icone ?? null, cat.tipo],
      );
      inserted.push(rows[0]);
    }
    await client.query("COMMIT");

    res.status(201).json({ created: inserted.length, data: inserted });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
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
