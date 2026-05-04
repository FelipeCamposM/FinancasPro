import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { JwtPayload } from "../types";

/** Autenticação via JWT Bearer — uso geral da API */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação não fornecido" });
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
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

/** Autenticação via API Key permanente — uso exclusivo do endpoint /atalho.
 *  Header esperado: Authorization: ApiKey <uuid> */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("ApiKey ")) {
    res.status(401).json({ error: "API Key não fornecida" });
    return;
  }

  const key = authHeader.slice(7).trim();
  try {
    const { rows } = await pool.query(
      "SELECT id, user_level FROM users WHERE api_key = $1",
      [key],
    );
    if (!rows[0]) {
      res.status(401).json({ error: "API Key inválida" });
      return;
    }
    req.user = { userId: rows[0].id, userLevel: rows[0].user_level };
    next();
  } catch (err) {
    next(err);
  }
};

/** Aceita JWT Bearer OU API Key — usado no endpoint /atalho para
 *  permitir teste via Swagger (JWT) e uso permanente via Shortcuts (ApiKey). */
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
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }
  }

  if (authHeader?.startsWith("ApiKey ")) {
    const key = authHeader.slice(7).trim();
    try {
      const { rows } = await pool.query(
        "SELECT id, user_level FROM users WHERE api_key = $1",
        [key],
      );
      if (!rows[0]) {
        res.status(401).json({ error: "API Key inválida" });
        return;
      }
      req.user = { userId: rows[0].id, userLevel: rows[0].user_level };
      return next();
    } catch (err) {
      return next(err);
    }
  }

  res.status(401).json({ error: "Autenticação não fornecida" });
};
