import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import pool from "../config/database";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../schemas/auth.schema";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { name, email, password, avatar, user_level }: RegisterInput = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, avatar, user_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, avatar, user_level, created_at`,
      [name, normalizedEmail, hash, avatar ?? null, user_level ?? "free"],
    );

    const user = rows[0];
    const token = signToken({ userId: user.id, email: user.email, userLevel: user.user_level });
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

    const token = signToken({ userId: user.id, email: user.email, userLevel: user.user_level });
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

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email }: ForgotPasswordInput = req.body;

    const { rows } = await pool.query(
      "SELECT id, name FROM users WHERE lower(email) = $1",
      [email.trim().toLowerCase()],
    );

    // Always respond 200 to avoid email enumeration
    if (!rows[0]) {
      res.json({ message: "Se este e-mail estiver cadastrado, você receberá o link em instantes." });
      return;
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalida tokens anteriores do usuário
    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
      [user.id],
    );

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt],
    );

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@financaspro.app",
      to: email,
      subject: "Redefinição de senha — FinançasPro",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
          <h2 style="color:#60a5fa;margin:0 0 8px">FinançasPro</h2>
          <p style="color:#94a3b8;margin:0 0 24px;font-size:14px">Controle financeiro pessoal</p>
          <h3 style="margin:0 0 12px;font-size:18px">Redefinir sua senha</h3>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 24px">
            Olá, ${user.name}! Recebemos um pedido para redefinir a senha da sua conta.
            Clique no botão abaixo para criar uma nova senha. Este link expira em <strong style="color:#e2e8f0">1 hora</strong>.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            Redefinir senha
          </a>
          <p style="color:#64748b;font-size:12px;margin:24px 0 0">
            Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.
          </p>
        </div>
      `,
    });

    res.json({ message: "Se este e-mail estiver cadastrado, você receberá o link em instantes." });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token, password }: ResetPasswordInput = req.body;

    const { rows } = await pool.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
       FROM password_reset_tokens prt
       WHERE prt.token = $1`,
      [token],
    );

    const record = rows[0];

    if (!record) {
      res.status(400).json({ error: "Token inválido ou expirado" });
      return;
    }
    if (record.used) {
      res.status(400).json({ error: "Este link já foi utilizado" });
      return;
    }
    if (new Date(record.expires_at) < new Date()) {
      res.status(400).json({ error: "Token expirado. Solicite um novo link." });
      return;
    }

    const hash = await bcrypt.hash(password, 12);

    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      hash,
      record.user_id,
    ]);

    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
      [record.id],
    );

    res.json({ message: "Senha redefinida com sucesso" });
  } catch (err) {
    next(err);
  }
};
