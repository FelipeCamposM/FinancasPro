import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database";
import { paginated } from "../utils/response";
import { UpdateUserInput, UpdatePasswordInput } from "../schemas/users.schema";

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { page, limit, offset } = req.pagination!;

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM users"),
      pool.query(
        "SELECT id, name, email, avatar, user_level, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id && req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { rows } = await pool.query(
      "SELECT id, name, email, avatar, user_level, created_at, updated_at FROM users WHERE id = $1",
      [id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id && req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { name, avatar }: UpdateUserInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (avatar !== undefined) {
      fields.push(`avatar = $${idx++}`);
      values.push(avatar);
    }
    if (!fields.length) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, avatar, user_level, updated_at`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { current_password, new_password }: UpdatePasswordInput = req.body;

    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [id],
    );
    if (
      !rows[0] ||
      !(await bcrypt.compare(current_password, rows[0].password_hash))
    ) {
      res.status(401).json({ error: "Senha atual incorreta" });
      return;
    }
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hash,
      id,
    ]);
    res.json({ message: "Senha atualizada com sucesso" });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id && req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);
    if (!rowCount) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
