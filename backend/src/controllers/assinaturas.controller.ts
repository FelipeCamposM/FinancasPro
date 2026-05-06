import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import {
  CreateAssinaturaInput,
  CancelAssinaturaInput,
  UpdateAssinaturaInput,
} from "../schemas/assinaturas.schema";

// Quantos meses à frente gerar gastos ao criar uma assinatura
const MESES_ANTECIPADOS = 24;

/** Retorna a data YYYY-MM-DD para o dia `dia` do mês/ano informado.
 *  Se o dia for maior que o último dia do mês, usa o último dia. */
function dataParaDia(ano: number, mes: number, dia: number): string {
  const ultimoDia = new Date(ano, mes, 0).getDate(); // mes aqui já é 1-based como arg para Date
  const diaReal = Math.min(dia, ultimoDia);
  return [
    ano,
    String(mes).padStart(2, "0"),
    String(diaReal).padStart(2, "0"),
  ].join("-");
}

// -------------------------------------------------------
// GET /assinaturas
// -------------------------------------------------------
export const listAssinaturas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const apenasAtivas = req.query.ativa !== "false";

    const { rows } = await pool.query(
      `SELECT a.*,
              c.nome AS categoria_nome,
              c.cor  AS categoria_cor,
              c.icone AS categoria_icone,
              ct.apelido AS cartao_apelido,
              ct.bandeira AS cartao_bandeira,
              ct.cor AS cartao_cor,
              ( SELECT COUNT(*)::int FROM gastos g WHERE g.assinatura_id = a.id ) AS total_lancamentos
       FROM assinaturas a
       LEFT JOIN categorias c  ON c.id  = a.categoria_id
       LEFT JOIN cartoes    ct ON ct.id = a.cartao_id
       WHERE a.user_id = $1
         ${apenasAtivas ? "AND a.ativa = TRUE" : ""}
       ORDER BY a.created_at DESC`,
      [userId],
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------
// GET /assinaturas/:id
// -------------------------------------------------------
export const getAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*,
              c.nome AS categoria_nome,
              c.cor  AS categoria_cor,
              ct.apelido AS cartao_apelido,
              ct.bandeira AS cartao_bandeira
       FROM assinaturas a
       LEFT JOIN categorias c  ON c.id  = a.categoria_id
       LEFT JOIN cartoes    ct ON ct.id = a.cartao_id
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Assinatura não encontrada" });
      return;
    }

    // Retorna também os lançamentos (gastos) vinculados
    const { rows: lancamentos } = await pool.query(
      `SELECT id, data_gasto, status, valor_total
       FROM gastos
       WHERE assinatura_id = $1
       ORDER BY data_gasto ASC`,
      [req.params.id],
    );

    res.json({ ...rows[0], lancamentos });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------
// POST /assinaturas
// -------------------------------------------------------
export const createAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId;
  const body: CreateAssinaturaInput = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Cria o registro da assinatura
    const { rows } = await client.query(
      `INSERT INTO assinaturas
         (user_id, descricao, valor, categoria_id, forma_pagamento, cartao_id,
          dia_cobranca, data_inicio, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        userId,
        body.descricao,
        body.valor,
        body.categoria_id ?? null,
        body.forma_pagamento,
        body.cartao_id ?? null,
        body.dia_cobranca,
        body.data_inicio,
        body.observacoes ?? null,
      ],
    );
    const assinatura = rows[0];

    // Gera os gastos mensais: mês de data_inicio até MESES_ANTECIPADOS à frente
    const inicio = new Date(body.data_inicio + "T12:00:00Z");
    const anoBase = inicio.getUTCFullYear();
    const mesBase = inicio.getUTCMonth() + 1; // 1-12

    for (let i = 0; i < MESES_ANTECIPADOS; i++) {
      const totalMeses = mesBase - 1 + i;
      const ano = anoBase + Math.floor(totalMeses / 12);
      const mes = (totalMeses % 12) + 1;
      const dataStr = dataParaDia(ano, mes, body.dia_cobranca);

      await client.query(
        `INSERT INTO gastos
           (user_id, descricao, valor_total, categoria_id, forma_pagamento, cartao_id,
            tipo_pagamento, quantidade_parcelas, data_gasto, observacoes, status,
            assinatura_id, numero_parcela)
         VALUES ($1,$2,$3,$4,$5,$6,'a_vista',1,$7,$8,'pendente',$9,1)`,
        [
          userId,
          body.descricao,
          body.valor,
          body.categoria_id ?? null,
          body.forma_pagamento,
          body.cartao_id ?? null,
          dataStr,
          body.observacoes ?? null,
          assinatura.id,
        ],
      );
    }

    await client.query("COMMIT");
    res.status(201).json(assinatura);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

// -------------------------------------------------------
// PUT /assinaturas/:id
// Atualiza campos descritivos da assinatura + propaga para gastos futuros pendentes
// -------------------------------------------------------
export const updateAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const { rows: existing } = await pool.query(
    "SELECT id, ativa FROM assinaturas WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  if (!existing[0]) {
    res.status(404).json({ error: "Assinatura não encontrada" });
    return;
  }

  const body: UpdateAssinaturaInput = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const updatable = ["descricao", "valor", "categoria_id", "observacoes", "dia_cobranca"];
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
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await client.query(
      `UPDATE assinaturas SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    const updated = rows[0];

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (existing[0].ativa) {
      if (body.dia_cobranca !== undefined) {
        // dia_cobranca mudou: apaga pendentes futuros e regenera com novo dia
        await client.query(
          `DELETE FROM gastos WHERE assinatura_id = $1 AND data_gasto >= $2 AND status = 'pendente'`,
          [id, todayStr],
        );

        const anoBase = today.getFullYear();
        const mesBase = today.getMonth() + 1;

        for (let i = 0; i < MESES_ANTECIPADOS; i++) {
          const totalMeses = mesBase - 1 + i;
          const ano = anoBase + Math.floor(totalMeses / 12);
          const mes = (totalMeses % 12) + 1;
          const dataStr = dataParaDia(ano, mes, updated.dia_cobranca);

          await client.query(
            `INSERT INTO gastos
               (user_id, descricao, valor_total, categoria_id, forma_pagamento, cartao_id,
                tipo_pagamento, quantidade_parcelas, data_gasto, observacoes, status,
                assinatura_id, numero_parcela)
             VALUES ($1,$2,$3,$4,$5,$6,'a_vista',1,$7,$8,'pendente',$9,1)`,
            [
              userId,
              updated.descricao,
              updated.valor,
              updated.categoria_id ?? null,
              updated.forma_pagamento,
              updated.cartao_id ?? null,
              dataStr,
              updated.observacoes ?? null,
              id,
            ],
          );
        }
      } else if (body.descricao || body.valor !== undefined) {
        // Apenas descricao/valor: atualiza in-place nos gastos pendentes
        const gastoFields: string[] = [];
        const gastoValues: unknown[] = [];
        let gi = 1;
        if (body.descricao) {
          gastoFields.push(`descricao = $${gi++}`);
          gastoValues.push(body.descricao);
        }
        if (body.valor !== undefined) {
          gastoFields.push(`valor_total = $${gi++}`);
          gastoValues.push(body.valor);
        }
        if (gastoFields.length) {
          gastoValues.push(id, todayStr);
          await client.query(
            `UPDATE gastos SET ${gastoFields.join(", ")}
             WHERE assinatura_id = $${gi++} AND data_gasto >= $${gi++} AND status = 'pendente'`,
            gastoValues,
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json(updated);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

// -------------------------------------------------------
// POST /assinaturas/:id/cancelar
// Marca a assinatura como inativa e remove gastos futuros pendentes
// -------------------------------------------------------
export const cancelAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const body: CancelAssinaturaInput = req.body;

  const { rows: existing } = await pool.query(
    "SELECT id FROM assinaturas WHERE id = $1 AND user_id = $2 AND ativa = TRUE",
    [id, userId],
  );
  if (!existing[0]) {
    res
      .status(404)
      .json({ error: "Assinatura não encontrada ou já cancelada" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Deleta gastos pendentes com data >= data_cancelamento
    const { rowCount: removidos } = await client.query(
      `DELETE FROM gastos
       WHERE assinatura_id = $1
         AND data_gasto >= $2
         AND status = 'pendente'`,
      [id, body.data_cancelamento],
    );

    // Marca a assinatura como inativa
    const { rows } = await client.query(
      `UPDATE assinaturas SET ativa = FALSE, data_cancelamento = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [body.data_cancelamento, id],
    );

    await client.query("COMMIT");
    res.json({ assinatura: rows[0], lancamentos_removidos: removidos ?? 0 });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

// -------------------------------------------------------
// POST /assinaturas/:id/reativar
// Reativa uma assinatura cancelada e gera lançamentos futuros
// -------------------------------------------------------
export const reativarAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const { rows: existing } = await pool.query(
    "SELECT * FROM assinaturas WHERE id = $1 AND user_id = $2 AND ativa = FALSE",
    [id, userId],
  );
  if (!existing[0]) {
    res.status(404).json({ error: "Assinatura não encontrada ou já ativa" });
    return;
  }
  const assinatura = existing[0];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE assinaturas SET ativa = TRUE, data_cancelamento = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );

    // Gera gastos pendentes a partir do mês atual
    const today = new Date();
    const anoBase = today.getFullYear();
    const mesBase = today.getMonth() + 1;

    for (let i = 0; i < MESES_ANTECIPADOS; i++) {
      const totalMeses = mesBase - 1 + i;
      const ano = anoBase + Math.floor(totalMeses / 12);
      const mes = (totalMeses % 12) + 1;
      const dataStr = dataParaDia(ano, mes, assinatura.dia_cobranca);

      await client.query(
        `INSERT INTO gastos
           (user_id, descricao, valor_total, categoria_id, forma_pagamento, cartao_id,
            tipo_pagamento, quantidade_parcelas, data_gasto, observacoes, status,
            assinatura_id, numero_parcela)
         VALUES ($1,$2,$3,$4,$5,$6,'a_vista',1,$7,$8,'pendente',$9,1)`,
        [
          userId,
          assinatura.descricao,
          assinatura.valor,
          assinatura.categoria_id ?? null,
          assinatura.forma_pagamento,
          assinatura.cartao_id ?? null,
          dataStr,
          assinatura.observacoes ?? null,
          id,
        ],
      );
    }

    await client.query("COMMIT");
    res.json({ assinatura: rows[0], lancamentos_gerados: MESES_ANTECIPADOS });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

// -------------------------------------------------------
// DELETE /assinaturas/:id
// Remove a assinatura e todos os lançamentos pendentes futuros
// -------------------------------------------------------
export const deleteAssinatura = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const { rows: existing } = await pool.query(
      "SELECT id FROM assinaturas WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if (!existing[0]) {
      res.status(404).json({ error: "Assinatura não encontrada" });
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Remove apenas gastos futuros pendentes; mantém histórico pago
    await pool.query(
      `DELETE FROM gastos
       WHERE assinatura_id = $1 AND data_gasto > $2 AND status = 'pendente'`,
      [id, today],
    );

    // Desvincula gastos passados (mantém o histórico)
    await pool.query(
      `UPDATE gastos SET assinatura_id = NULL WHERE assinatura_id = $1`,
      [id],
    );

    await pool.query("DELETE FROM assinaturas WHERE id = $1", [id]);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
