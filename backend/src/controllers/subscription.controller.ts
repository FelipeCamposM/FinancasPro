import { Request, Response, NextFunction } from "express";
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from "mercadopago";
import crypto from "crypto";
import pool from "../config/database";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET as string;
const PUBLIC_URL     = process.env.MP_PUBLIC_URL ?? process.env.FRONTEND_URL ?? "https://valorafinancas.com";

const PRICE_MONTHLY          = 9.9000;
const PRICE_ANNUAL           = 94.9000;
const MONTHLY_RATE_OF_ANNUAL = parseFloat((PRICE_ANNUAL / 12).toFixed(4)); // 7.9083
void MONTHLY_RATE_OF_ANNUAL; // unused now — kept for reference

// ── helpers ───────────────────────────────────────────────────────────────────

async function getOrCreatePlan(): Promise<string> {
  const envPlanId = process.env.MP_PLAN_ID;
  if (envPlanId) return envPlanId;

  const planApi = new PreApprovalPlan(client);
  const plan = await planApi.create({
    body: {
      reason: "Valora Premium",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PRICE_MONTHLY,
        currency_id: "BRL",
        free_trial: { frequency: 7, frequency_type: "days" },
      },
      back_url: `${PUBLIC_URL}/assinatura`,
    },
  });

  return plan.id as string;
}

// ── endpoints ─────────────────────────────────────────────────────────────────

export const createCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId, email } = req.user!;
    const { plan = "monthly" } = req.body as { plan?: "monthly" | "annual" };

    const [{ rows }, { rows: trialRows }] = await Promise.all([
      pool.query("SELECT mp_subscription_id, trial_ends_at FROM users WHERE id = $1", [userId]),
      pool.query("SELECT 1 FROM trial_used_emails WHERE email = $1", [email]),
    ]);

    if (rows[0]?.mp_subscription_id) {
      res.status(400).json({ error: "Você já possui uma assinatura ativa." });
      return;
    }

    // Trial usado se já consta no registro global de emails OU no próprio perfil
    const hasUsedTrial = !!rows[0]?.trial_ends_at || trialRows.length > 0;
    const isAnnual     = plan === "annual";
    const amount       = isAnnual ? PRICE_ANNUAL : PRICE_MONTHLY;
    const frequency    = isAnnual ? 12 : 1;
    const planId       = await getOrCreatePlan();
    void planId;

    console.log("[MP] plan:", plan, "amount:", amount, "hasUsedTrial:", hasUsedTrial);

    const autoRecurring: Record<string, unknown> = {
      frequency,
      frequency_type: "months",
      transaction_amount: amount,
      currency_id: "BRL",
    };
    if (!hasUsedTrial) {
      autoRecurring.free_trial = { frequency: 7, frequency_type: "days" };
    }

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: isAnnual ? "Valora Premium Anual" : "Valora Premium Mensal",
        payer_email: email,
        back_url: `${PUBLIC_URL}/assinatura`,
        external_reference: `${userId}|${plan}`,
        auto_recurring: autoRecurring,
      }),
    });

    const data = await response.json() as Record<string, unknown>;
    console.log("[MP] preapproval response:", JSON.stringify(data));

    if (!response.ok) {
      res.status(400).json({ error: (data.message as string) ?? "Erro ao criar assinatura" });
      return;
    }

    const initPoint = data.init_point as string;
    res.json({ url: initPoint });
  } catch (err) {
    next(err);
  }
};

export const changePlan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user!;
    const { plan } = req.body as { plan?: "monthly" | "annual" };

    if (!plan || !["monthly", "annual"].includes(plan)) {
      res.status(400).json({ error: "Plano inválido." });
      return;
    }

    const { rows } = await pool.query(
      "SELECT mp_subscription_id, subscription_plan FROM users WHERE id = $1",
      [userId],
    );

    const subId       = rows[0]?.mp_subscription_id as string | undefined;
    const currentPlan = rows[0]?.subscription_plan as string | undefined;

    if (!subId) {
      res.status(400).json({ error: "Nenhuma assinatura ativa encontrada." });
      return;
    }

    if (currentPlan === plan) {
      res.status(400).json({ error: "Você já está neste plano." });
      return;
    }

    if (currentPlan === "courtesy") {
      res.status(400).json({ error: "Plano cortesia não pode ser alterado aqui." });
      return;
    }

    const isAnnual  = plan === "annual";
    const amount    = isAnnual ? PRICE_ANNUAL : PRICE_MONTHLY;
    const frequency = isAnnual ? 12 : 1;
    const reason    = isAnnual ? "Valora Premium Anual" : "Valora Premium Mensal";

    const response = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        auto_recurring: {
          frequency,
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "BRL",
        },
      }),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      res.status(400).json({ error: (data.message as string) ?? "Erro ao alterar plano" });
      return;
    }

    await pool.query(
      "UPDATE users SET subscription_plan = $1 WHERE id = $2",
      [plan, userId],
    );

    const label = isAnnual ? "Anual (R$94,90/ano)" : "Mensal (R$9,90/mês)";
    res.json({ message: `Plano alterado para ${label}. A mudança entra em vigor na próxima cobrança.` });
  } catch (err) {
    next(err);
  }
};

export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId } = req.user!;

    const { rows } = await pool.query(
      `SELECT mp_subscription_id, subscription_ends_at FROM users WHERE id = $1`,
      [userId],
    );

    const subId = rows[0]?.mp_subscription_id as string | undefined;

    if (!subId) {
      res.status(400).json({ error: "Nenhuma assinatura encontrada." });
      return;
    }

    // Cancel in MP (stops future billing)
    const preapproval = new PreApproval(client);
    await preapproval.update({ id: subId, body: { status: "cancelled" } });

    // Soft cancel: mark cancelled_at, keep premium access until subscription_ends_at
    await pool.query(
      `UPDATE users SET subscription_cancelled_at = NOW() WHERE id = $1`,
      [userId],
    );

    const accessUntil = rows[0]?.subscription_ends_at
      ? new Date(rows[0].subscription_ends_at as string).toLocaleDateString("pt-BR")
      : null;

    const message = accessUntil
      ? `Renovação cancelada. Acesso garantido até ${accessUntil}.`
      : "Renovação cancelada com sucesso.";

    res.json({ message, refunded: false, refund_amount: 0, months_remaining: 0 });
  } catch (err) {
    next(err);
  }
};

export const getStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT user_level, trial_ends_at, subscription_ends_at,
              mp_payer_id, mp_subscription_id,
              subscription_plan, subscription_started_at,
              subscription_cancelled_at
       FROM users WHERE id = $1`,
      [req.user!.userId],
    );

    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    const row = rows[0] as {
      user_level: string;
      trial_ends_at: Date | null;
      subscription_ends_at: Date | null;
      mp_payer_id: string | null;
      mp_subscription_id: string | null;
      subscription_plan: string | null;
      subscription_started_at: Date | null;
      subscription_cancelled_at: Date | null;
    };

    // Lazy revocation: if cancelled and period has ended, downgrade to free
    if (row.subscription_cancelled_at && row.subscription_ends_at && new Date(row.subscription_ends_at) < new Date()) {
      await pool.query(
        `UPDATE users
         SET user_level = 'free',
             mp_subscription_id = NULL,
             subscription_ends_at = NULL,
             subscription_cancelled_at = NULL,
             subscription_plan = 'monthly',
             subscription_started_at = NULL
         WHERE id = $1`,
        [req.user!.userId],
      );
      row.user_level = "free";
      row.mp_subscription_id = null;
      row.subscription_ends_at = null;
      row.subscription_cancelled_at = null;
    }

    res.json({ data: row });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;

  if (WEBHOOK_SECRET && xSignature && xRequestId) {
    const parts    = Object.fromEntries(xSignature.split(",").map((p) => p.split("=")));
    const ts       = parts["ts"];
    const hash     = parts["v1"];
    const manifest = `id:${(req.body as { id?: string }).id};request-id:${xRequestId};ts:${ts};`;
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");

    if (hash !== expected) {
      res.status(400).json({ error: "Assinatura de webhook inválida" });
      return;
    }
  }

  try {
    const notification = req.body as { type?: string; data?: { id?: string } };
    const type         = notification.type;
    const dataId       = notification.data?.id;

    if (!dataId) { res.json({ received: true }); return; }

    if (type === "preapproval") {
      const preapproval = new PreApproval(client);
      const sub         = await preapproval.get({ id: dataId });
      const subRaw      = sub as unknown as Record<string, unknown>;

      const subId       = sub.id as string;
      const status      = sub.status;
      const payerId     = sub.payer_id?.toString() ?? null;
      const externalRef = subRaw["external_reference"] as string | null;
      const nextPayment = sub.next_payment_date
        ? new Date(sub.next_payment_date as string)
        : null;

      const [userId, plan = "monthly"] = (externalRef ?? "").split("|");

      switch (status) {
        case "authorized": {
          const summarized = subRaw["summarized"] as Record<string, unknown> | undefined;
          const trialEnd   = summarized?.["charged_quantity"] === 0 ? nextPayment : null;

          if (userId) {
            await pool.query(
              `UPDATE users
               SET user_level = 'premium',
                   mp_subscription_id = $1,
                   mp_payer_id = $2,
                   subscription_ends_at = $3,
                   trial_ends_at = COALESCE($4, trial_ends_at),
                   subscription_plan = $5,
                   subscription_started_at = COALESCE(subscription_started_at, NOW()),
                   subscription_cancelled_at = NULL
               WHERE id = $6`,
              [subId, payerId, nextPayment, trialEnd, plan, userId],
            );

            // Register email in global trial registry so it can never be reused
            if (trialEnd) {
              const { rows: userRows } = await pool.query(
                "SELECT email FROM users WHERE id = $1",
                [userId],
              );
              if (userRows[0]?.email) {
                await pool.query(
                  "INSERT INTO trial_used_emails (email) VALUES ($1) ON CONFLICT DO NOTHING",
                  [userRows[0].email],
                );
              }
            }
          } else {
            // Renewal: link by subscription ID
            await pool.query(
              `UPDATE users
               SET user_level = 'premium',
                   mp_payer_id = $1,
                   subscription_ends_at = $2,
                   subscription_cancelled_at = NULL
               WHERE mp_subscription_id = $3`,
              [payerId, nextPayment, subId],
            );
          }
          break;
        }

        case "cancelled": {
          // Soft revocation: keep premium if period hasn't ended yet
          await pool.query(
            `UPDATE users
             SET subscription_cancelled_at = NOW(),
                 user_level = CASE WHEN subscription_ends_at > NOW() THEN 'premium' ELSE 'free' END,
                 mp_subscription_id = CASE WHEN subscription_ends_at > NOW() THEN mp_subscription_id ELSE NULL END,
                 subscription_ends_at = CASE WHEN subscription_ends_at > NOW() THEN subscription_ends_at ELSE NULL END
             WHERE mp_subscription_id = $1`,
            [subId],
          );
          break;
        }

        case "expired": {
          await pool.query(
            `UPDATE users
             SET user_level = 'free',
                 mp_subscription_id = NULL,
                 subscription_ends_at = NULL,
                 subscription_plan = 'monthly',
                 subscription_started_at = NULL,
                 subscription_cancelled_at = NULL
             WHERE mp_subscription_id = $1`,
            [subId],
          );
          break;
        }

        case "paused": {
          await pool.query(
            `UPDATE users SET user_level = 'free' WHERE mp_subscription_id = $1`,
            [subId],
          );
          break;
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("MP Webhook error:", err);
    res.status(500).json({ error: "Erro interno no webhook" });
  }
};
