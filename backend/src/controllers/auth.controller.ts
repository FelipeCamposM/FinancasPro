import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import pool from "../config/database";
import {
  RegisterInput,
  LoginInput,
  EmailCodeRequestInput,
  EmailCodeVerifyInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../schemas/auth.schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const AUTH_CODE_EXPIRATION_MINUTES = 15;
const AUTH_CODE_RESEND_COOLDOWN_SECONDS = 60;

type EmailAuthPurpose = "email_verification" | "login";
type EmailCodeSendResult =
  | { sent: true; retryAfterSeconds: number }
  | { sent: false; retryAfterSeconds: number };

function signToken(payload: object): string {
  const opts: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, process.env.JWT_SECRET as string, opts);
}

function createEmailCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashEmailCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function getEmailSubject(purpose: EmailAuthPurpose): string {
  return purpose === "email_verification"
    ? "Verifique sua conta - FinancasPro"
    : "Seu codigo de acesso - FinancasPro";
}

function getEmailTitle(purpose: EmailAuthPurpose): string {
  return purpose === "email_verification" ? "Verifique sua conta" : "Entrar sem senha";
}

function getEmailIntro(name: string, purpose: EmailAuthPurpose): string {
  return purpose === "email_verification"
    ? `Ola, ${name}! Use o codigo abaixo para confirmar seu e-mail e ativar sua conta.`
    : `Ola, ${name}! Use o codigo abaixo para entrar na sua conta sem senha.`;
}

async function createAndSendEmailCode(
  user: { id: string; name: string; email: string },
  purpose: EmailAuthPurpose,
): Promise<EmailCodeSendResult> {
  const { rows } = await pool.query(
    `SELECT created_at
     FROM email_auth_codes
     WHERE user_id = $1 AND purpose = $2 AND used = FALSE
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id, purpose],
  );

  const latestCode = rows[0];
  if (latestCode) {
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(latestCode.created_at).getTime()) / 1000,
    );
    const retryAfterSeconds = AUTH_CODE_RESEND_COOLDOWN_SECONDS - elapsedSeconds;

    if (retryAfterSeconds > 0) {
      return { sent: false, retryAfterSeconds };
    }
  }

  const code = createEmailCode();
  const codeHash = hashEmailCode(code);
  const expiresAt = new Date(Date.now() + AUTH_CODE_EXPIRATION_MINUTES * 60 * 1000);

  await pool.query(
    "UPDATE email_auth_codes SET used = TRUE, used_at = NOW() WHERE user_id = $1 AND purpose = $2 AND used = FALSE",
    [user.id, purpose],
  );

  await pool.query(
    `INSERT INTO email_auth_codes (user_id, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [user.id, purpose, codeHash, expiresAt],
  );

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@financaspro.app",
    to: user.email,
    subject: getEmailSubject(purpose),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#60a5fa;margin:0 0 8px">FinancasPro</h2>
        <p style="color:#94a3b8;margin:0 0 24px;font-size:14px">Controle financeiro pessoal</p>
        <h3 style="margin:0 0 12px;font-size:18px">${getEmailTitle(purpose)}</h3>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 20px">
          ${getEmailIntro(user.name, purpose)}
        </p>
        <div style="letter-spacing:8px;font-size:32px;font-weight:700;color:#fff;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 20px;text-align:center">
          ${code}
        </div>
        <p style="color:#64748b;font-size:12px;margin:20px 0 0">
          Este codigo expira em ${AUTH_CODE_EXPIRATION_MINUTES} minutos. Se voce nao solicitou isso, ignore este e-mail.
        </p>
      </div>
    `,
  });

  return { sent: true, retryAfterSeconds: AUTH_CODE_RESEND_COOLDOWN_SECONDS };
}

async function validateEmailCode(
  userId: string,
  purpose: EmailAuthPurpose,
  code: string,
): Promise<{ id: string; expires_at: Date; used: boolean } | null> {
  const { rows } = await pool.query(
    `SELECT id, expires_at, used
     FROM email_auth_codes
     WHERE user_id = $1 AND purpose = $2 AND code_hash = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, purpose, hashEmailCode(code)],
  );

  const record = rows[0];
  if (!record || record.used || new Date(record.expires_at) < new Date()) {
    return null;
  }

  return record;
}

const DEFAULT_CATEGORIAS = [
  { nome: "Alimentação", cor: "#EF4444", icone: "🍽️", tipo: "gasto" },
  { nome: "Transporte", cor: "#F97316", icone: "🚗", tipo: "gasto" },
  { nome: "Saúde", cor: "#06B6D4", icone: "💊", tipo: "gasto" },
  { nome: "Educação", cor: "#8B5CF6", icone: "📚", tipo: "gasto" },
  { nome: "Lazer", cor: "#EC4899", icone: "🎮", tipo: "gasto" },
  { nome: "Moradia", cor: "#6366F1", icone: "🏠", tipo: "gasto" },
  { nome: "Vestuário", cor: "#F59E0B", icone: "👕", tipo: "gasto" },
  { nome: "Tecnologia", cor: "#3B82F6", icone: "💻", tipo: "gasto" },
  { nome: "Assinaturas", cor: "#14B8A6", icone: "📱", tipo: "gasto" },
  { nome: "Pets", cor: "#A78BFA", icone: "🐾", tipo: "gasto" },
  { nome: "Viagem", cor: "#FB923C", icone: "✈️", tipo: "gasto" },
  { nome: "Beleza & Estética", cor: "#F472B6", icone: "💅", tipo: "gasto" },
  { nome: "Mercado", cor: "#84CC16", icone: "🛒", tipo: "gasto" },
  { nome: "Farmácia", cor: "#34D399", icone: "💉", tipo: "gasto" },
  { nome: "Outros Gastos", cor: "#9CA3AF", icone: "📦", tipo: "gasto" },
  { nome: "Salário", cor: "#22C55E", icone: "💰", tipo: "renda" },
  { nome: "Freelance", cor: "#EAB308", icone: "💼", tipo: "renda" },
  { nome: "Investimentos", cor: "#10B981", icone: "📈", tipo: "renda" },
  { nome: "Aluguel Recebido", cor: "#0EA5E9", icone: "🏘️", tipo: "renda" },
  { nome: "Bônus", cor: "#6366F1", icone: "🎁", tipo: "renda" },
  { nome: "Vendas", cor: "#F97316", icone: "🛍️", tipo: "renda" },
  { nome: "Outros Rendimentos", cor: "#9CA3AF", icone: "💵", tipo: "renda" },
] as const;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const client = await pool.connect();
  try {
    const { name, email, password, avatar, user_level }: RegisterInput = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 12);

    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, avatar, user_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, avatar, user_level, email_verified, created_at`,
      [name, normalizedEmail, hash, avatar ?? null, user_level ?? "free"],
    );
    const user = rows[0];

    for (const cat of DEFAULT_CATEGORIAS) {
      await client.query(
        "INSERT INTO categorias (user_id, nome, cor, icone, tipo) VALUES ($1,$2,$3,$4,$5)",
        [user.id, cat.nome, cat.cor, cat.icone, cat.tipo],
      );
    }

    await client.query("COMMIT");
    const codeResult = await createAndSendEmailCode(user, "email_verification");

    res.status(201).json({
      user,
      message: "Conta criada. Enviamos um codigo para confirmar seu e-mail.",
      retry_after_seconds: codeResult.retryAfterSeconds,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
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
      `SELECT id, name, email, password_hash, avatar, user_level, email_verified, created_at, updated_at
       FROM users
       WHERE lower(email) = $1`,
      [normalizedEmail],
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: "Credenciais invalidas" });
      return;
    }

    if (!user.email_verified) {
      const codeResult = await createAndSendEmailCode(user, "email_verification");
      res.status(403).json({
        error: codeResult.sent
          ? "Confirme seu e-mail antes de entrar. Enviamos um novo codigo de verificacao."
          : "Confirme seu e-mail antes de entrar.",
        code: "EMAIL_NOT_VERIFIED",
        retry_after_seconds: codeResult.retryAfterSeconds,
      });
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
      "SELECT id, name, email, avatar, user_level, email_verified, created_at, updated_at FROM users WHERE id = $1",
      [req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Usuario nao encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const requestEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email }: EmailCodeRequestInput = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      "SELECT id, name, email, email_verified FROM users WHERE lower(email) = $1",
      [normalizedEmail],
    );

    const user = rows[0];
    let retryAfterSeconds: number | undefined;
    if (user && !user.email_verified) {
      const codeResult = await createAndSendEmailCode(user, "email_verification");
      retryAfterSeconds = codeResult.retryAfterSeconds;

      if (!codeResult.sent) {
        res.status(429).json({
          error: "Aguarde antes de reenviar o codigo.",
          retry_after_seconds: codeResult.retryAfterSeconds,
        });
        return;
      }
    }

    res.json({
      message: "Se este e-mail precisar de confirmacao, voce recebera um codigo em instantes.",
      retry_after_seconds: retryAfterSeconds,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, code }: EmailCodeVerifyInput = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      "SELECT id, name, email, avatar, user_level, email_verified, created_at FROM users WHERE lower(email) = $1",
      [normalizedEmail],
    );

    const user = rows[0];
    if (!user) {
      res.status(400).json({ error: "Codigo invalido ou expirado" });
      return;
    }

    if (user.email_verified) {
      res.status(400).json({ error: "E-mail ja verificado. Entre pela tela de login." });
      return;
    }

    const record = await validateEmailCode(user.id, "email_verification", code);
    if (!record) {
      res.status(400).json({ error: "Codigo invalido ou expirado" });
      return;
    }

    await pool.query("UPDATE email_auth_codes SET used = TRUE, used_at = NOW() WHERE id = $1", [
      record.id,
    ]);

    await pool.query(
      "UPDATE users SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW() WHERE id = $1",
      [user.id],
    );
    user.email_verified = true;

    const token = signToken({ userId: user.id, email: user.email, userLevel: user.user_level });
    res.json({ user, token, message: "E-mail verificado com sucesso" });
  } catch (err) {
    next(err);
  }
};

export const requestLoginCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email }: EmailCodeRequestInput = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      "SELECT id, name, email, email_verified FROM users WHERE lower(email) = $1",
      [normalizedEmail],
    );

    const user = rows[0];
    let retryAfterSeconds: number | undefined;
    if (user?.email_verified) {
      const codeResult = await createAndSendEmailCode(user, "login");
      retryAfterSeconds = codeResult.retryAfterSeconds;

      if (!codeResult.sent) {
        res.status(429).json({
          error: "Aguarde antes de reenviar o codigo.",
          retry_after_seconds: codeResult.retryAfterSeconds,
        });
        return;
      }
    }

    res.json({
      message: "Se este e-mail estiver cadastrado e verificado, voce recebera um codigo em instantes.",
      retry_after_seconds: retryAfterSeconds,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyLoginCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, code }: EmailCodeVerifyInput = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      `SELECT id, name, email, avatar, user_level, email_verified, created_at, updated_at
       FROM users
       WHERE lower(email) = $1`,
      [normalizedEmail],
    );

    const user = rows[0];
    if (!user?.email_verified) {
      res.status(400).json({ error: "Codigo invalido ou expirado" });
      return;
    }

    const record = await validateEmailCode(user.id, "login", code);
    if (!record) {
      res.status(400).json({ error: "Codigo invalido ou expirado" });
      return;
    }

    await pool.query("UPDATE email_auth_codes SET used = TRUE, used_at = NOW() WHERE id = $1", [
      record.id,
    ]);

    const token = signToken({ userId: user.id, email: user.email, userLevel: user.user_level });
    res.json({ user, token });
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

    if (!rows[0]) {
      res.json({ message: "Se este e-mail estiver cadastrado, voce recebera o link em instantes." });
      return;
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

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
      subject: "Redefinicao de senha - FinancasPro",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
          <h2 style="color:#60a5fa;margin:0 0 8px">FinancasPro</h2>
          <p style="color:#94a3b8;margin:0 0 24px;font-size:14px">Controle financeiro pessoal</p>
          <h3 style="margin:0 0 12px;font-size:18px">Redefinir sua senha</h3>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 24px">
            Ola, ${user.name}! Recebemos um pedido para redefinir a senha da sua conta.
            Clique no botao abaixo para criar uma nova senha. Este link expira em <strong style="color:#e2e8f0">1 hora</strong>.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            Redefinir senha
          </a>
          <p style="color:#64748b;font-size:12px;margin:24px 0 0">
            Se voce nao solicitou isso, ignore este e-mail. Sua senha permanece a mesma.
          </p>
        </div>
      `,
    });

    res.json({ message: "Se este e-mail estiver cadastrado, voce recebera o link em instantes." });
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
      res.status(400).json({ error: "Token invalido ou expirado" });
      return;
    }
    if (record.used) {
      res.status(400).json({ error: "Este link ja foi utilizado" });
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

    await pool.query("UPDATE password_reset_tokens SET used = TRUE WHERE id = $1", [record.id]);

    res.json({ message: "Senha redefinida com sucesso" });
  } catch (err) {
    next(err);
  }
};
