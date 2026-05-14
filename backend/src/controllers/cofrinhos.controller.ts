import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import {
  CreateCofrinhoInput,
  UpdateCofrinhoInput,
} from "../schemas/cofrinhos.schema";

const TIPO_COLUMNS = [
  "tipo",
  "nome",
  "saldo_atual",
  "meta_valor",
  "ticker",
  "quantidade_cotas",
  "instituicao",
  "data_alvo",
  "observacoes",
  "ativo",
] as const;

function normalizeByTipo<T extends CreateCofrinhoInput | UpdateCofrinhoInput>(
  body: T,
): T {
  const next = { ...body } as Record<string, unknown>;
  const tipo = next.tipo;

  if (tipo === "acao") {
    next.meta_valor = null;
    next.instituicao = null;
    next.data_alvo = null;
  } else if (tipo === "conta") {
    next.meta_valor = null;
    next.ticker = null;
    next.quantidade_cotas = null;
    next.data_alvo = null;
  } else if (tipo === "objetivo") {
    next.ticker = null;
    next.quantidade_cotas = null;
    next.instituicao = null;
  }

  return next as T;
}

function hasRequiredFields(body: CreateCofrinhoInput | UpdateCofrinhoInput) {
  if (body.tipo === "acao") {
    return !!body.ticker && !!body.quantidade_cotas;
  }
  if (body.tipo === "objetivo") {
    return !!body.meta_valor;
  }
  return true;
}

export const listCofrinhos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;
    const filters = ["user_id = $1"];
    const values: unknown[] = [userId];
    let idx = 2;

    if (req.query.tipo) {
      filters.push(`tipo = $${idx++}`);
      values.push(req.query.tipo);
    }

    if (req.query.ativo !== undefined) {
      filters.push(`ativo = $${idx++}`);
      values.push(req.query.ativo === "false" ? false : true);
    }

    const whereClause = filters.join(" AND ");
    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM cofrinhos WHERE ${whereClause}`,
        values,
      ),
      pool.query(
        `SELECT *
         FROM cofrinhos
         WHERE ${whereClause}
         ORDER BY ativo DESC, tipo, nome
         LIMIT $${idx++} OFFSET $${idx}`,
        [...values, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getCofrinho = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM cofrinhos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );

    if (!rows[0]) {
      res.status(404).json({ error: "Cofrinho n\u00e3o encontrado" });
      return;
    }

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const createCofrinho = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body = normalizeByTipo(req.body as CreateCofrinhoInput);
    if (!hasRequiredFields(body)) {
      res.status(422).json({ error: "Dados inv\u00e1lidos" });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO cofrinhos
        (user_id, tipo, nome, saldo_atual, meta_valor, ticker, quantidade_cotas,
         instituicao, data_alvo, observacoes, ativo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        userId,
        body.tipo,
        body.nome,
        body.saldo_atual ?? 0,
        body.meta_valor ?? null,
        body.ticker ?? null,
        body.quantidade_cotas ?? null,
        body.instituicao ?? null,
        body.data_alvo ?? null,
        body.observacoes ?? null,
        body.ativo ?? true,
      ],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateCofrinho = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows: existing } = await pool.query(
      "SELECT * FROM cofrinhos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );

    if (!existing[0]) {
      res.status(404).json({ error: "Cofrinho n\u00e3o encontrado" });
      return;
    }

    const merged = normalizeByTipo({
      ...existing[0],
      ...(req.body as UpdateCofrinhoInput),
    });
    if (!hasRequiredFields(merged)) {
      res.status(422).json({ error: "Dados inv\u00e1lidos" });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const key of TIPO_COLUMNS) {
      fields.push(`${key} = $${idx++}`);
      values.push((merged as Record<string, unknown>)[key] ?? null);
    }

    values.push(req.params.id, req.user!.userId);
    const { rows } = await pool.query(
      `UPDATE cofrinhos
       SET ${fields.join(", ")}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      values,
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteCofrinho = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM cofrinhos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );

    if (!rowCount) {
      res.status(404).json({ error: "Cofrinho n\u00e3o encontrado" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getCofrinhosSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(saldo_atual), 0)::float AS total_guardado,
         COALESCE(SUM(meta_valor), 0)::float AS total_planejado,
         COALESCE(SUM(saldo_atual) FILTER (WHERE tipo = 'acao'), 0)::float AS total_acoes,
         COALESCE(SUM(saldo_atual) FILTER (WHERE tipo = 'conta'), 0)::float AS total_contas,
         COALESCE(SUM(saldo_atual) FILTER (WHERE tipo = 'objetivo'), 0)::float AS total_objetivos,
         COALESCE(SUM(meta_valor) FILTER (WHERE tipo = 'objetivo'), 0)::float AS metas_objetivos,
         COUNT(*)::int AS total_itens,
         COUNT(*) FILTER (WHERE tipo = 'acao')::int AS total_itens_acoes,
         COUNT(*) FILTER (WHERE tipo = 'conta')::int AS total_itens_contas,
         COUNT(*) FILTER (WHERE tipo = 'objetivo')::int AS total_itens_objetivos
       FROM cofrinhos
       WHERE user_id = $1 AND ativo = true`,
      [userId],
    );

    const summary = rows[0];
    const metasObjetivos = Number(summary.metas_objetivos || 0);
    const totalObjetivos = Number(summary.total_objetivos || 0);

    res.json({
      data: {
        ...summary,
        progresso_objetivos:
          metasObjetivos > 0 ? Math.min(100, (totalObjetivos / metasObjetivos) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
