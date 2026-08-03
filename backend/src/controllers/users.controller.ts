import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database";
import { paginated } from "../utils/response";
import {
  UpdateUserInput,
  UpdatePasswordInput,
  PreferenciasInput,
  PREFERENCIAS_PADRAO,
} from "../schemas/users.schema";

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { page, limit, offset } = req.pagination!;

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM users"),
      pool.query(
        "SELECT id, name, email, avatar, user_level, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id && req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { rows } = await pool.query(
      "SELECT id, name, email, avatar, user_level, created_at, updated_at FROM users WHERE id = $1",
      [id],
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

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id && req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { name, avatar }: UpdateUserInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (avatar !== undefined) {
      fields.push(`avatar = $${idx++}`);
      values.push(avatar);
    }
    if (!fields.length) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, avatar, user_level, updated_at`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { current_password, new_password }: UpdatePasswordInput = req.body;

    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [id],
    );
    if (
      !rows[0] ||
      !(await bcrypt.compare(current_password, rows[0].password_hash))
    ) {
      res.status(401).json({ error: "Senha atual incorreta" });
      return;
    }
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hash,
      id,
    ]);
    res.json({ message: "Senha atualizada com sucesso" });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;
    if (req.user!.userId !== id && req.user!.userLevel !== "admin") {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);
    if (!rowCount) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/** GET /api/users/me/api-key — retorna a API Key permanente do usuário. */
export const getApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT api_key FROM users WHERE id = $1",
      [req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json({ api_key: rows[0].api_key });
  } catch (err) {
    next(err);
  }
};

/** POST /api/users/me/api-key/rotate — gera uma nova API Key, invalidando a anterior. */
export const rotateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "UPDATE users SET api_key = gen_random_uuid() WHERE id = $1 RETURNING api_key",
      [req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json({ api_key: rows[0].api_key });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/me/preferencias
 * Devolve as preferências do usuário já mescladas com os padrões.
 */
export const getPreferencias = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT preferencias FROM users WHERE id = $1",
      [req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json({ data: { ...PREFERENCIAS_PADRAO, ...(rows[0].preferencias ?? {}) } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/me/preferencias
 * Merge parcial: só as chaves enviadas são alteradas.
 */
export const updatePreferencias = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body: PreferenciasInput = req.body;
    if (!Object.keys(body).length) {
      res.status(400).json({ error: "Nenhuma preferência para atualizar" });
      return;
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET preferencias = COALESCE(preferencias, '{}'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2
       RETURNING preferencias`,
      [JSON.stringify(body), req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json({ data: { ...PREFERENCIAS_PADRAO, ...(rows[0].preferencias ?? {}) } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/me/export
 * Todos os lançamentos do usuário, sem paginação, para exportação em CSV.
 * Aceita recorte opcional por data (?de=YYYY-MM-DD&ate=YYYY-MM-DD).
 */
export const exportarDados = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const de = req.query.de as string | undefined;
    const ate = req.query.ate as string | undefined;

    const filtroGasto: string[] = ["g.user_id = $1"];
    const filtroRenda: string[] = ["r.user_id = $1"];
    const valores: unknown[] = [userId];
    if (de) {
      valores.push(de);
      filtroGasto.push(`g.data_gasto >= $${valores.length}`);
      filtroRenda.push(`r.data_recebimento >= $${valores.length}`);
    }
    if (ate) {
      valores.push(ate);
      filtroGasto.push(`g.data_gasto <= $${valores.length}`);
      filtroRenda.push(`r.data_recebimento <= $${valores.length}`);
    }

    const [gastos, renda] = await Promise.all([
      pool.query(
        `SELECT g.descricao, g.valor_total, g.data_gasto, g.forma_pagamento,
                g.tipo_pagamento, g.quantidade_parcelas, g.numero_parcela,
                g.status, g.observacoes,
                c.nome AS categoria, ct.apelido AS cartao
         FROM gastos g
         LEFT JOIN categorias c ON c.id = g.categoria_id
         LEFT JOIN cartoes ct ON ct.id = g.cartao_id
         WHERE ${filtroGasto.join(" AND ")}
         ORDER BY g.data_gasto DESC`,
        valores,
      ),
      pool.query(
        `SELECT r.descricao, r.valor, r.tipo, r.origem, r.mes_referencia,
                r.data_recebimento, r.recorrente, r.observacoes,
                c.nome AS categoria
         FROM renda r
         LEFT JOIN categorias c ON c.id = r.categoria_id
         WHERE ${filtroRenda.join(" AND ")}
         ORDER BY r.data_recebimento DESC`,
        valores,
      ),
    ]);

    res.json({ data: { gastos: gastos.rows, renda: renda.rows } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/me/lancamentos
 * Apaga gastos, parcelas, renda e assinaturas do usuário. Mantém a conta,
 * as categorias e os cartões. Operação destrutiva — confirmada no frontend.
 */
export const apagarLancamentos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM parcelas WHERE gasto_id IN (SELECT id FROM gastos WHERE user_id = $1)",
      [userId],
    );
    const gastos = await client.query("DELETE FROM gastos WHERE user_id = $1", [
      userId,
    ]);
    const renda = await client.query("DELETE FROM renda WHERE user_id = $1", [
      userId,
    ]);
    const assinaturas = await client.query(
      "DELETE FROM assinaturas WHERE user_id = $1",
      [userId],
    );
    await client.query("COMMIT");
    res.json({
      data: {
        gastos: gastos.rowCount ?? 0,
        renda: renda.rowCount ?? 0,
        assinaturas: assinaturas.rowCount ?? 0,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};
