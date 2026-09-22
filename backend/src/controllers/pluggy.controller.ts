import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import pool from "../config/database";
import { CreatePluggyItemInput } from "../schemas/pluggy.schema";

const WEBHOOK_SECRET = process.env.PLUGGY_WEBHOOK_SECRET ?? "";

// A Pluggy não assina o payload, então o segredo vai na própria URL cadastrada
// no dashboard (?secret=...). Comparação em tempo constante para não vazar o
// valor por timing.
const segredoConfere = (recebido: string): boolean => {
  if (!WEBHOOK_SECRET || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(WEBHOOK_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

type PluggyEvento = {
  event?: string;
  itemId?: string;
  id?: string;
};

export const handleWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const recebido =
    (req.query.secret as string | undefined) ??
    (req.headers["x-webhook-secret"] as string | undefined) ??
    "";

  if (!segredoConfere(recebido)) {
    res.status(401).json({ error: "Segredo de webhook inválido" });
    return;
  }

  const { event, itemId } = (req.body ?? {}) as PluggyEvento;

  // Responde antes de processar: a Pluggy marca como falha e reenvia se
  // demorarmos. O corpo é entrada não-confiável — só o itemId é aproveitado,
  // e os dados reais são buscados na API da Pluggy.
  res.status(200).json({ received: true });

  // ponytail: por enquanto só registra o evento. A sincronização de
  // accounts/transactions entra quando a tabela pluggy_items existir.
  console.log("[pluggy] webhook", { event, itemId });
};

// ── conexões (itemId) ─────────────────────────────────────────────────────────
// O GET /v2/items da Pluggy é opt-in e está desabilitado na conta, então o
// itemId é copiado do dashboard e cadastrado aqui na mão.

export const listItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM pluggy_items WHERE user_id = $1 ORDER BY created_at",
      [req.user!.userId],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

export const createItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { item_id, apelido }: CreatePluggyItemInput = req.body;
    const { rows } = await pool.query(
      `INSERT INTO pluggy_items (user_id, item_id, apelido)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, item_id) DO UPDATE SET apelido = EXCLUDED.apelido
       RETURNING *`,
      [req.user!.userId, item_id, apelido ?? null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM pluggy_items WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Conexão não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
