import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import pool from "../config/database";
import { paginated } from "../utils/response";
import { CreateGastoInput, UpdateGastoInput } from "../schemas/gastos.schema";

export const listGastos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;

    // Filtros opcionais via query string
    const filters: string[] = ["g.user_id = $1"];
    const values: unknown[] = [userId];
    let idx = 2;

    if (req.query.status) {
      filters.push(`g.status = $${idx++}`);
      values.push(req.query.status);
    }
    if (req.query.categoria_id) {
      filters.push(`g.categoria_id = $${idx++}`);
      values.push(Number(req.query.categoria_id));
    }
    if (req.query.cartao_id) {
      filters.push(`g.cartao_id = $${idx++}`);
      values.push(req.query.cartao_id);
    }
    if (req.query.forma_pagamento) {
      filters.push(`g.forma_pagamento = $${idx++}`);
      values.push(req.query.forma_pagamento);
    }
    if (req.query.tipo_pagamento) {
      filters.push(`g.tipo_pagamento = $${idx++}`);
      values.push(req.query.tipo_pagamento);
    }
    if (req.query.data_inicio) {
      filters.push(`g.data_gasto >= $${idx++}`);
      values.push(req.query.data_inicio);
    }
    if (req.query.data_fim) {
      filters.push(`g.data_gasto <= $${idx++}`);
      values.push(req.query.data_fim);
    }

    const where = filters.join(" AND ");

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM gastos g WHERE ${where}`,
        values,
      ),
      pool.query(
        `SELECT g.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone,
                ct.apelido AS cartao_apelido, ct.bandeira AS cartao_bandeira, ct.cor AS cartao_cor, ct.ultimos_4_digitos AS cartao_ultimos_4_digitos
         FROM gastos g
         LEFT JOIN categorias c ON c.id = g.categoria_id
         LEFT JOIN cartoes ct ON ct.id = g.cartao_id
         WHERE ${where}
         ORDER BY g.data_gasto DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        [...values, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone,
              ct.apelido AS cartao_apelido, ct.bandeira AS cartao_bandeira, ct.cor AS cartao_cor
       FROM gastos g
       LEFT JOIN categorias c ON c.id = g.categoria_id
       LEFT JOIN cartoes ct ON ct.id = g.cartao_id
       WHERE g.id = $1 AND g.user_id = $2`,
      [req.params.id, req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body: CreateGastoInput = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `INSERT INTO gastos
          (user_id, descricao, valor_total, categoria_id, forma_pagamento, cartao_id,
           tipo_pagamento, quantidade_parcelas, recorrente, frequencia_recorrencia,
           data_fim_recorrencia, data_gasto, observacoes, status, gasto_origem_id, numero_parcela)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          userId,
          body.descricao,
          body.valor_total,
          body.categoria_id ?? null,
          body.forma_pagamento,
          body.cartao_id ?? null,
          body.tipo_pagamento,
          body.quantidade_parcelas,
          body.recorrente,
          body.frequencia_recorrencia ?? null,
          body.data_fim_recorrencia ?? null,
          body.data_gasto,
          body.observacoes ?? null,
          body.status,
          body.gasto_origem_id ?? null,
          1,
        ],
      );

      const gasto = rows[0];

      // Criar cobranças futuras como registros independentes em gastos (parcelas 2..N).
      // O gasto original já representa a 1ª parcela.
      if (body.tipo_pagamento === "parcelado" && body.quantidade_parcelas > 1) {
        const [anoBase, mesBase, diaBase] = body.data_gasto
          .split("-")
          .map(Number);
        for (let i = 1; i < body.quantidade_parcelas; i++) {
          const dataFutura = new Date(anoBase, mesBase - 1 + i, diaBase, 12);
          const dataStr = [
            dataFutura.getFullYear(),
            String(dataFutura.getMonth() + 1).padStart(2, "0"),
            String(dataFutura.getDate()).padStart(2, "0"),
          ].join("-");
          await client.query(
            `INSERT INTO gastos
              (user_id, descricao, valor_total, categoria_id, forma_pagamento, cartao_id,
               tipo_pagamento, quantidade_parcelas, recorrente,
               data_gasto, observacoes, status, gasto_origem_id, numero_parcela)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [
              userId,
              body.descricao,
              body.valor_total,
              body.categoria_id ?? null,
              body.forma_pagamento,
              body.cartao_id ?? null,
              body.tipo_pagamento,
              body.quantidade_parcelas,
              false,
              dataStr,
              body.observacoes ?? null,
              body.status,
              gasto.id,
              i + 1,
            ],
          );
        }
      }

      await client.query("COMMIT");
      res.status(201).json(gasto);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

export const updateGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM gastos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!existing[0]) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }

    const body: UpdateGastoInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const updatable: string[] = [
      "descricao",
      "valor_total",
      "categoria_id",
      "forma_pagamento",
      "cartao_id",
      "recorrente",
      "frequencia_recorrencia",
      "data_fim_recorrencia",
      "data_gasto",
      "observacoes",
      "status",
    ];
    const typedBody = body as Record<string, unknown>;
    for (const key of updatable) {
      if (key in typedBody) {
        fields.push(`${key} = $${idx++}`);
        values.push(typedBody[key] ?? null);
      }
    }
    if (!fields.length) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE gastos SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM gastos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ── Schema de validação do endpoint /atalho (formato Notion via iPhone Shortcuts) ──
const atalhoBodySchema = z.object({
  parent: z.object({ database_id: z.string() }).optional(),
  forma_pagamento: z
    .enum(["dinheiro", "cartao_credito", "cartao_debito", "pix", "transferencia", "outro"])
    .optional(),
  cartao_id: z.string().uuid().optional(),
  properties: z.object({
    DescricaoGasto: z.object({
      title: z
        .array(
          z.object({ text: z.object({ content: z.string().min(1).max(255) }) }),
        )
        .min(1),
    }),
    ValorGasto: z.object({ number: z.number().positive() }),
    Categoria: z.object({ select: z.object({ name: z.string() }) }).optional(),
    Data: z.object({ date: z.object({ start: z.string() }) }),
  }),
});

/**
 * POST /api/gastos/atalho
 * Registra um gasto parcial vindo do iPhone Shortcuts (formato Notion).
 * Sempre cartao_credito + a_vista + cartao_id=null (preenchido depois na web).
 */
export const createGastoAtalho = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    console.log("[atalho] body recebido:", JSON.stringify(req.body, null, 2));
    const parsed = atalhoBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      );
      res.status(422).json({ error: "Dados inválidos", details });
      return;
    }

    const userId = req.user!.userId;
    const { properties, forma_pagamento, cartao_id } = parsed.data;

    const descricao = properties.DescricaoGasto.title[0].text.content;
    const valor_total = properties.ValorGasto.number;
    // Remove prefixo "emoji - " caso venha do Shortcuts formatado (ex: "🍕 - Alimentação" → "Alimentação")
    const rawCategoria = properties.Categoria?.select?.name ?? null;
    // Remove prefixo "emoji-" ou "emoji - " (ex: "🏠-Moradia" ou "🍕 - Alimentação" → "Moradia" / "Alimentação")
    const categoriaName = rawCategoria
      ? rawCategoria.replace(/^[^-]+-/, "").trim()
      : null;
    // Suporta "2026-03-27" e "2026-03-27T14:30:00" — extrai apenas a data
    const data_gasto = properties.Data.date.start.slice(0, 10);

    // Resolve categoria pelo nome (prefere a do usuário antes da global)
    let categoria_id: number | null = null;
    if (categoriaName) {
      const catRes = await pool.query(
        `SELECT id FROM categorias
         WHERE nome ILIKE $1
           AND tipo = 'gasto'
           AND (user_id = $2 OR user_id IS NULL)
         ORDER BY user_id NULLS LAST
         LIMIT 1`,
        [categoriaName, userId],
      );
      if (catRes.rows[0]) categoria_id = catRes.rows[0].id as number;
    }

    const { rows } = await pool.query(
      `INSERT INTO gastos
         (user_id, descricao, valor_total, categoria_id,
          forma_pagamento, cartao_id,
          tipo_pagamento, quantidade_parcelas,
          recorrente, data_gasto, status, numero_parcela)
       VALUES ($1,$2,$3,$4,$5,$6,'a_vista',1,false,$7,'pago',1)
       RETURNING *`,
      [userId, descricao, valor_total, categoria_id, forma_pagamento ?? "cartao_credito", cartao_id ?? null, data_gasto],
    );

    const g = rows[0];
    res.status(200).json({
      ok: true,
      id: g.id,
      descricao: g.descricao,
      valor: g.valor_total,
      data: g.data_gasto,
    });
  } catch (err) {
    next(err);
  }
};
