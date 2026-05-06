import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { JwtPayload } from "../types";

function getApiKeyFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("ApiKey ")) {
    return authHeader.slice(7).trim();
  }

  const apiKeyHeader = req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string") {
    return apiKeyHeader.trim();
  }

  return null;
}

async function authenticateWithApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
  key: string,
): Promise<void> {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, user_level FROM users WHERE api_key = $1",
      [key],
    );
    if (!rows[0]) {
      res.status(401).json({ error: "API Key invalida" });
      return;
    }
    req.user = {
      userId: rows[0].id,
      email: rows[0].email,
      userLevel: rows[0].user_level,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Autenticacao via JWT Bearer - uso geral da API */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticacao nao fornecido" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token invalido ou expirado" });
  }
};

/** Autenticacao via API Key permanente.
 *  Headers aceitos: Authorization: ApiKey <uuid> ou x-api-key: <uuid> */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const key = getApiKeyFromRequest(req);
  if (!key) {
    res.status(401).json({ error: "API Key nao fornecida" });
    return;
  }

  await authenticateWithApiKey(req, res, next, key);
};

/** Aceita JWT Bearer ou API Key. */
export const authenticateAny = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as JwtPayload;
      req.user = payload;
      return next();
    } catch {
      res.status(401).json({ error: "Token invalido ou expirado" });
      return;
    }
  }

  const apiKey = getApiKeyFromRequest(req);
  if (apiKey) {
    await authenticateWithApiKey(req, res, next, apiKey);
    return;
  }

  res.status(401).json({ error: "Autenticacao nao fornecida" });
};
