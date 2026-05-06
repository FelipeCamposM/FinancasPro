import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import pool from "../config/database";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

function signToken(payload: object): string {
  const opts: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, process.env.JWT_SECRET as string, opts);
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password, avatar, user_level }: RegisterInput =
      req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, avatar, user_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, avatar, user_level, created_at`,
      [name, normalizedEmail, hash, avatar ?? null, user_level ?? "free"],
    );

    const user = rows[0];
    const token = signToken({
      userId: user.id,
      email: user.email,
      userLevel: user.user_level,
    });

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE lower(email) = $1",
      [normalizedEmail],
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      userLevel: user.user_level,
    });

    const { password_hash: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, avatar, user_level, created_at, updated_at FROM users WHERE id = $1",
      [req.user!.userId],
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
