import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import {
  CreateCartaoInput,
  UpdateCartaoInput,
} from "../schemas/cartoes.schema";

export const listCartoes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;
    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int AS count FROM cartoes WHERE user_id = $1",
        [userId],
      ),
      pool.query(
        "SELECT * FROM cartoes WHERE user_id = $1 ORDER BY ativo DESC, apelido LIMIT $2 OFFSET $3",
        [userId, limit, offset],
      ),
    ]);
    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getCartao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM cartoes WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createCartao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body: CreateCartaoInput = req.body;
    const { rows } = await pool.query(
      `INSERT INTO cartoes
        (user_id, apelido, nome_no_cartao, ultimos_4_digitos, bandeira, tipo, cor, banco, limite, dia_fechamento, dia_vencimento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        userId,
        body.apelido,
        body.nome_no_cartao,
        body.ultimos_4_digitos,
        body.bandeira,
        body.tipo,
        body.cor,
        body.banco,
        body.limite ?? null,
        body.dia_fechamento ?? null,
        body.dia_vencimento ?? null,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateCartao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM cartoes WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!existing[0]) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const body: UpdateCartaoInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    const updatable: string[] = [
      "apelido",
      "nome_no_cartao",
      "cor",
      "banco",
      "limite",
      "dia_fechamento",
      "dia_vencimento",
      "ativo",
    ];
    for (const key of updatable) {
      const typedBody = body as Record<string, unknown>;
      if (typedBody[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(typedBody[key] === null ? null : typedBody[key]);
      }
    }
    if (!fields.length) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE cartoes SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteCartao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM cartoes WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
