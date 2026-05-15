import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import {
  CreateCofrinhoInput,
  UpdateCofrinhoInput,
  depositarContaSchema,
  depositarAcaoSchema,
} from "../schemas/cofrinhos.schema";

const TIPO_COLUMNS = [
  "tipo",
  "nome",
  "saldo_atual",
  "meta_valor",
  "ticker",
  "quantidade_cotas",
  "valor_cota",
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
    next.instituicao = null;
    const qtd = Number(next.quantidade_cotas ?? 0);
    const vc = Number(next.valor_cota ?? 0);
    next.saldo_atual = qtd * vc;
  } else if (tipo === "conta") {
    next.ticker = null;
    next.quantidade_cotas = null;
    next.valor_cota = null;
  }

  return next as T;
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
      res.status(404).json({ error: "Cofrinho não encontrado" });
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

    const { rows } = await pool.query(
      `INSERT INTO cofrinhos
        (user_id, tipo, nome, saldo_atual, meta_valor, ticker, quantidade_cotas,
         valor_cota, instituicao, data_alvo, observacoes, ativo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        userId,
        body.tipo,
        body.nome,
        body.saldo_atual ?? 0,
        body.meta_valor ?? null,
        body.ticker ?? null,
        body.quantidade_cotas ?? null,
        (body as Record<string, unknown>).valor_cota ?? null,
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
      res.status(404).json({ error: "Cofrinho não encontrado" });
      return;
    }

    const merged = normalizeByTipo({
      ...existing[0],
      ...(req.body as UpdateCofrinhoInput),
    });

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
      res.status(404).json({ error: "Cofrinho não encontrado" });
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
         COALESCE(SUM(saldo_atual) FILTER (WHERE tipo = 'acao'), 0)::float AS total_acoes,
         COALESCE(SUM(saldo_atual) FILTER (WHERE tipo = 'conta'), 0)::float AS total_contas,
         COUNT(*)::int AS total_itens,
         COUNT(*) FILTER (WHERE tipo = 'acao')::int AS total_itens_acoes,
         COUNT(*) FILTER (WHERE tipo = 'conta')::int AS total_itens_contas
       FROM cofrinhos
       WHERE user_id = $1 AND ativo = true`,
      [userId],
    );

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const depositarCofrinho = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cofrinhoId = req.params.id;

    const { rows } = await pool.query(
      "SELECT * FROM cofrinhos WHERE id = $1 AND user_id = $2",
      [cofrinhoId, userId],
    );

    if (!rows[0]) {
      res.status(404).json({ error: "Cofrinho não encontrado" });
      return;
    }

    const cofrinho = rows[0];

    if (cofrinho.tipo === "conta") {
      const parsed = depositarContaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: "Dados inválidos", details: parsed.error.flatten() });
        return;
      }
      const { valor, observacoes } = parsed.data;

      await pool.query(
        "UPDATE cofrinhos SET saldo_atual = saldo_atual + $1 WHERE id = $2",
        [valor, cofrinhoId],
      );
      await pool.query(
        `INSERT INTO cofrinho_movimentacoes (cofrinho_id, user_id, tipo, valor, observacoes)
         VALUES ($1, $2, 'deposito', $3, $4)`,
        [cofrinhoId, userId, valor, observacoes ?? null],
      );
    } else if (cofrinho.tipo === "acao") {
      const parsed = depositarAcaoSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: "Dados inválidos", details: parsed.error.flatten() });
        return;
      }
      const { quantidade_cotas, valor_cota, observacoes } = parsed.data;
      const novaQtd = Number(cofrinho.quantidade_cotas ?? 0) + Number(quantidade_cotas);
      const novoSaldo = novaQtd * Number(valor_cota);
      const valorMovimentacao = Number(quantidade_cotas) * Number(valor_cota);

      await pool.query(
        "UPDATE cofrinhos SET quantidade_cotas = $1, valor_cota = $2, saldo_atual = $3 WHERE id = $4",
        [novaQtd, valor_cota, novoSaldo, cofrinhoId],
      );
      await pool.query(
        `INSERT INTO cofrinho_movimentacoes
           (cofrinho_id, user_id, tipo, quantidade_cotas, valor_cota, valor, observacoes)
         VALUES ($1, $2, 'adicao_cotas', $3, $4, $5, $6)`,
        [cofrinhoId, userId, quantidade_cotas, valor_cota, valorMovimentacao, observacoes ?? null],
      );
    } else {
      res.status(422).json({ error: "Tipo de cofrinho não suporta depósito" });
      return;
    }

    const { rows: updated } = await pool.query(
      "SELECT * FROM cofrinhos WHERE id = $1",
      [cofrinhoId],
    );

    res.json({ data: updated[0] });
  } catch (err) {
    next(err);
  }
};

export const getMovimentacoes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cofrinhoId = req.params.id;

    const { rows: owns } = await pool.query(
      "SELECT id FROM cofrinhos WHERE id = $1 AND user_id = $2",
      [cofrinhoId, userId],
    );

    if (!owns[0]) {
      res.status(404).json({ error: "Cofrinho não encontrado" });
      return;
    }

    const { rows: tableExists } = await pool.query(
      "SELECT to_regclass('public.cofrinho_movimentacoes') AS table_name",
    );

    if (!tableExists[0]?.table_name) {
      res.json({ data: [] });
      return;
    }

    const { rows } = await pool.query(
      `SELECT * FROM cofrinho_movimentacoes
       WHERE cofrinho_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [cofrinhoId, userId],
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};
