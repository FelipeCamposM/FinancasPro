import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import pool from "../config/database";

export const generateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await pool.query(
      `INSERT INTO shortcut_setup_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt],
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

export const activateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const t = req.query.t as string | undefined;

    if (!t) {
      res.status(400).json({ error: "Token ausente" });
      return;
    }

    const { rows } = await pool.query(
      `SELECT sst.id, sst.user_id, sst.expires_at, sst.used, u.api_key
       FROM shortcut_setup_tokens sst
       JOIN users u ON u.id = sst.user_id
       WHERE sst.token = $1`,
      [t],
    );

    const record = rows[0];

    if (!record) {
      res.status(400).json({ error: "Token inválido" });
      return;
    }
    if (record.used) {
      res.status(400).json({ error: "Token já utilizado" });
      return;
    }
    if (new Date(record.expires_at) < new Date()) {
      res.status(400).json({ error: "Token expirado" });
      return;
    }

    await pool.query(
      "UPDATE shortcut_setup_tokens SET used = TRUE WHERE id = $1",
      [record.id],
    );

    res.json({ api_key: record.api_key });
  } catch (err) {
    next(err);
  }
};

export const getMyKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT api_key FROM users WHERE id = $1",
      [req.user!.userId],
    );
    res.json({ api_key: rows[0]?.api_key ?? null });
  } catch (err) {
    next(err);
  }
};

export const rotateKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET api_key = gen_random_uuid(), updated_at = NOW()
       WHERE id = $1
       RETURNING api_key`,
      [req.user!.userId],
    );
    res.json({ api_key: rows[0].api_key });
  } catch (err) {
    next(err);
  }
};
