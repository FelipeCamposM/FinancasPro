import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";

const PRICE_MONTHLY = 9.9000;
const PRICE_ANNUAL  = 94.9000;
const PUBLIC_URL    = process.env.MP_PUBLIC_URL ?? process.env.FRONTEND_URL ?? "https://valorafinancas.com";

export const getStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                                        AS total,
        COUNT(*) FILTER (WHERE user_level = 'premium')::int                 AS premium,
        COUNT(*) FILTER (WHERE user_level = 'free')::int                    AS free,
        COUNT(*) FILTER (WHERE user_level = 'admin')::int                   AS admin,
        COUNT(*) FILTER (WHERE trial_ends_at > NOW())::int                  AS trial_ativo,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS novos_30d,
        (SELECT COUNT(*)::int FROM gastos WHERE via_atalho = TRUE)          AS total_atalho_gastos
      FROM users
    `);
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const search = (req.query.search as string | undefined)?.trim() ?? "";
    const level  = (req.query.level  as string | undefined)?.trim() ?? "";

    const conditions: string[] = [];
    const params: unknown[]    = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (level && ["free", "premium", "admin"].includes(level)) {
      params.push(level);
      conditions.push(`user_level = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countParams = [...params];
    const rowParams   = [...params, limit, offset];

    const [{ rows: totalRows }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM users ${where}`,
        countParams,
      ),
      pool.query(
        `SELECT
           id, name, email, avatar, user_level, email_verified,
           trial_ends_at, subscription_ends_at, subscription_plan,
           created_at, last_login_at,
           (SELECT COUNT(*)::int FROM gastos WHERE user_id = users.id AND via_atalho = TRUE) AS shortcut_count,
           (SELECT MAX(created_at)  FROM gastos WHERE user_id = users.id AND via_atalho = TRUE) AS last_shortcut_at
         FROM users
         ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        rowParams,
      ),
    ]);

    res.json(paginated(rows, totalRows[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const updateUserLevel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { user_level } = req.body as { user_level: string };

    const VALID = ["free", "premium", "courtesy", "admin"];
    if (!VALID.includes(user_level)) {
      res.status(400).json({ error: "user_level inválido" });
      return;
    }

    let rows: Record<string, unknown>[];

    if (user_level === "courtesy") {
      // Premium cortesia: acesso premium permanente sem cobrança
      ({ rows } = await pool.query(
        `UPDATE users
         SET user_level = 'premium',
             subscription_plan = 'courtesy',
             mp_subscription_id = NULL,
             subscription_ends_at = NULL,
             subscription_started_at = NULL,
             subscription_cancelled_at = NULL
         WHERE id = $1
         RETURNING id, name, email, user_level, subscription_plan`,
        [id],
      ));
    } else if (user_level === "free") {
      ({ rows } = await pool.query(
        `UPDATE users
         SET user_level = 'free',
             subscription_plan = 'monthly',
             mp_subscription_id = NULL,
             subscription_ends_at = NULL,
             subscription_started_at = NULL,
             subscription_cancelled_at = NULL
         WHERE id = $1
         RETURNING id, name, email, user_level, subscription_plan`,
        [id],
      ));
    } else {
      ({ rows } = await pool.query(
        `UPDATE users SET user_level = $1 WHERE id = $2
         RETURNING id, name, email, user_level, subscription_plan`,
        [user_level, id],
      ));
    }

    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const createAdminCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan } = req.body as { plan?: "monthly" | "annual" };

    if (!plan || !["monthly", "annual"].includes(plan)) {
      res.status(400).json({ error: "Plano inválido. Use 'monthly' ou 'annual'." });
      return;
    }

    const { rows } = await pool.query(
      "SELECT email, trial_ends_at, mp_subscription_id FROM users WHERE id = $1",
      [id],
    );

    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    if (rows[0].mp_subscription_id) {
      res.status(400).json({ error: "Usuário já possui assinatura ativa." });
      return;
    }

    const email = rows[0].email as string;

    const { rows: trialRows } = await pool.query(
      "SELECT 1 FROM trial_used_emails WHERE email = $1",
      [email],
    );
    const hasUsedTrial = !!rows[0].trial_ends_at || trialRows.length > 0;
    const isAnnual     = plan === "annual";
    const amount       = isAnnual ? PRICE_ANNUAL : PRICE_MONTHLY;
    const frequency    = isAnnual ? 12 : 1;

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
        external_reference: `${id}|${plan}`,
        auto_recurring: autoRecurring,
      }),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      res.status(400).json({ error: (data.message as string) ?? "Erro ao criar checkout" });
      return;
    }

    res.json({ url: data.init_point as string });
  } catch (err) {
    next(err);
  }
};
