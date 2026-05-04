import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { paginated } from "../utils/response";
import { CreateRendaInput, UpdateRendaInput } from "../schemas/renda.schema";

export const listRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const userId = req.user!.userId;
    const mesQuery = req.query.mes as string | undefined;

    // Filtros base — excluindo o filtro de mês para aplicá-lo de forma especial
    const baseFilters: string[] = [
      "r.user_id = $1",
      "r.renda_origem_id IS NULL",
    ];
    const values: unknown[] = [userId];
    let idx = 2;

    if (req.query.tipo) {
      baseFilters.push(`r.tipo = $${idx++}`);
      values.push(req.query.tipo);
    }
    if (req.query.categoria_id) {
      baseFilters.push(`r.categoria_id = $${idx++}`);
      values.push(Number(req.query.categoria_id));
    }
    if (req.query.data_inicio) {
      baseFilters.push(`r.data_recebimento >= $${idx++}`);
      values.push(req.query.data_inicio);
    }
    if (req.query.data_fim) {
      baseFilters.push(`r.data_recebimento <= $${idx++}`);
      values.push(req.query.data_fim);
    }

    // Quando há filtro de mês: retorna entradas do mês OU templates recorrentes ativos
    // Templates recorrentes = recorrente=true, sem data_fim OU data_fim >= início do mês
    let whereClause: string;
    let mesParamIdx: number | null = null;
    if (mesQuery) {
      mesParamIdx = idx;
      values.push(mesQuery + "-01"); // normaliza para YYYY-MM-DD
      idx++;
      const m = mesParamIdx;
      whereClause = `(${baseFilters.join(" AND ")}) AND (
          DATE_TRUNC('month', r.mes_referencia) = DATE_TRUNC('month', $${m}::date)
          OR (
            r.recorrente = true
            AND (r.data_fim_recorrencia IS NULL OR r.data_fim_recorrencia >= DATE_TRUNC('month', $${m}::date))
          )
        )`;
    } else {
      whereClause = baseFilters.join(" AND ");
    }

    // Campo computado: se o template recorrente já foi lançado naquele mês
    const lancadaSubquery =
      mesParamIdx !== null
        ? `EXISTS (
           SELECT 1 FROM renda inst
           WHERE inst.renda_origem_id = r.id
             AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $${mesParamIdx}::date)
         ) AS lancada_neste_mes`
        : `false AS lancada_neste_mes`;

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM renda r WHERE ${whereClause}`,
        values,
      ),
      pool.query(
        `SELECT r.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone,
                ${lancadaSubquery}
         FROM renda r
         LEFT JOIN categorias c ON c.id = r.categoria_id
         WHERE ${whereClause}
         ORDER BY r.recorrente DESC, r.data_recebimento DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        [...values, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, c.nome AS categoria_nome, c.cor AS categoria_cor, c.icone AS categoria_icone
       FROM renda r
       LEFT JOIN categorias c ON c.id = r.categoria_id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user!.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Renda não encontrada" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const createRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body: CreateRendaInput = req.body;
    const { rows } = await pool.query(
      `INSERT INTO renda
        (user_id, descricao, valor, tipo, origem, categoria_id, mes_referencia,
         data_recebimento, recorrente, frequencia_recorrencia, data_fim_recorrencia, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        userId,
        body.descricao,
        body.valor,
        body.tipo,
        body.origem,
        body.categoria_id ?? null,
        body.mes_referencia,
        body.data_recebimento,
        body.recorrente,
        body.frequencia_recorrencia ?? null,
        body.data_fim_recorrencia ?? null,
        body.observacoes ?? null,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM renda WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!existing[0]) {
      res.status(404).json({ error: "Renda não encontrada" });
      return;
    }

    const body: UpdateRendaInput = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    const updatable: string[] = [
      "descricao",
      "valor",
      "tipo",
      "origem",
      "categoria_id",
      "mes_referencia",
      "data_recebimento",
      "recorrente",
      "frequencia_recorrencia",
      "data_fim_recorrencia",
      "renda_origem_id",
      "observacoes",
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
      `UPDATE renda SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM renda WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user!.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Renda não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/renda/auto-lancar-mes
 * Cria automaticamente instâncias do mês indicado para todos os templates
 * recorrentes ativos que ainda não possuem instância naquele mês.
 */
export const autoLancarMes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mesRaw =
      (req.body.mes as string) ?? new Date().toISOString().slice(0, 7);
    const mesDate = mesRaw.length === 7 ? mesRaw + "-01" : mesRaw;

    const { rows: templates } = await pool.query(
      `SELECT * FROM renda
       WHERE user_id = $1
         AND recorrente = true
         AND renda_origem_id IS NULL
         AND DATE_TRUNC('month', mes_referencia) <= DATE_TRUNC('month', $2::date)
         AND (data_fim_recorrencia IS NULL
              OR data_fim_recorrencia >= DATE_TRUNC('month', $2::date))
         AND NOT EXISTS (
           SELECT 1 FROM renda inst
           WHERE inst.renda_origem_id = renda.id
             AND DATE_TRUNC('month', inst.mes_referencia) = DATE_TRUNC('month', $2::date)
         )`,
      [userId, mesDate],
    );

    for (const tpl of templates) {
      // INSERT atômico: o WHERE NOT EXISTS faz parte do próprio INSERT,
      // eliminando a race condition de chamadas simultâneas.
      await pool.query(
        `INSERT INTO renda
          (user_id, descricao, valor, tipo, origem, categoria_id, mes_referencia,
           data_recebimento, recorrente, frequencia_recorrencia, data_fim_recorrencia,
           renda_origem_id, observacoes)
         SELECT $1,$2,$3,$4,$5,$6,$7,$8,false,$9,$10,$11,$12
         WHERE NOT EXISTS (
           SELECT 1 FROM renda
           WHERE renda_origem_id = $11
             AND DATE_TRUNC('month', mes_referencia) = DATE_TRUNC('month', $7::date)
         )`,
        [
          userId,
          tpl.descricao,
          tpl.valor,
          tpl.tipo,
          tpl.origem,
          tpl.categoria_id,
          mesDate,
          mesDate,
          tpl.frequencia_recorrencia,
          tpl.data_fim_recorrencia,
          tpl.id,
          tpl.observacoes,
        ],
      );
    }

    res.json({ created: templates.length });
  } catch (err) {
    next(err);
  }
};
