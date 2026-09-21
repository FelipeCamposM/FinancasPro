import { Request, Response } from "express";
import crypto from "crypto";

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
