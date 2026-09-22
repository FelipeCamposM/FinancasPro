import { Request, Response, NextFunction } from "express";
import { PoolClient } from "pg";
import pool from "../config/database";
import { paginated } from "../utils/response";
import { PROJECAO_PARCELAS_SQL } from "./openfinance-parcelas.controller";

// ── contas e cartões ─────────────────────────────────────────────────────────

export const listContas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, p.apelido AS conexao_apelido, p.last_sync_at
         FROM of_contas c
         JOIN pluggy_items p ON p.id = c.pluggy_item_id
        WHERE c.user_id = $1
        ORDER BY c.nome`,
      [req.user!.userId],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * A fatura não é o `balance` da Pluggy (aquilo é o limite usado total): é a
 * soma das saídas da competência corrente do cartão, que vem transação a
 * transação em creditCardMetadata.billForecastDate.
 *
 * Encargos (IOF, juros, anuidade) saem em coluna própria porque o app do banco
 * não os mostra no valor da fatura em aberto — somá-los deixaria o número
 * fora do que o usuário vê. Eles continuam em of_gastos.
 *
 * Créditos da competência são estorno; o pagamento da fatura anterior cai como
 * 'ignorado' no sync e por isso não entra aqui.
 */
export const FATURA_SQL = `
  SELECT t.of_cartao_id,
         t.competencia,
         -- Estorno abate a fatura: é ajuste de preço de uma compra da própria
         -- competência, não entrada de dinheiro.
         (COALESCE(SUM(t.valor) FILTER (
            WHERE t.tipo = 'debito' AND NOT t.encargo), 0)
          - COALESCE(SUM(t.valor) FILTER (
            WHERE t.tipo = 'credito'), 0))::numeric(14,2)                AS fatura,
         COALESCE(SUM(t.valor) FILTER (
           WHERE t.tipo = 'debito' AND t.encargo), 0)::numeric(14,2)     AS encargos,
         COALESCE(SUM(t.valor) FILTER (
           WHERE t.tipo = 'credito'), 0)::numeric(14,2)                  AS estornos,
         COUNT(*) FILTER (WHERE t.tipo = 'debito')::int                  AS lancamentos
    FROM of_transacoes t
   WHERE t.user_id = $1
     AND t.of_cartao_id IS NOT NULL
     AND t.destino <> 'ignorado'
   GROUP BY t.of_cartao_id, t.competencia`;

export const listCartoes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const competencia = (req.query.competencia as string | undefined) ?? null;
    const { rows } = await pool.query(
      `WITH faturas AS (${FATURA_SQL}),
       -- Sem competência informada, vale a mais recente que o cartão tem:
       -- é a fatura em aberto, mesmo que o sync esteja um dia atrasado.
       alvo AS (
         SELECT of_cartao_id,
                COALESCE($2::date, MAX(competencia)) AS competencia
           FROM faturas GROUP BY of_cartao_id
       )
       SELECT c.*,
              p.last_sync_at,
              a.competencia,
              COALESCE(f.fatura, 0)      AS fatura_atual,
              COALESCE(f.encargos, 0)    AS encargos,
              COALESCE(f.estornos, 0)    AS estornos,
              COALESCE(f.lancamentos, 0) AS lancamentos,
              -- o disponível usa o limite usado total, não a fatura do mês
              COALESCE(c.limite, 0) - COALESCE(c.limite_usado, 0) AS limite_disponivel,
              COALESCE(c.dia_fechamento_manual, c.dia_fechamento) AS dia_fechamento_efetivo,
              COALESCE(c.dia_vencimento_manual, c.dia_vencimento) AS dia_vencimento_efetivo
         FROM of_cartoes c
         JOIN pluggy_items p ON p.id = c.pluggy_item_id
         LEFT JOIN alvo    a ON a.of_cartao_id = c.id
         LEFT JOIN faturas f ON f.of_cartao_id = c.id AND f.competencia = a.competencia
        WHERE c.user_id = $1
        ORDER BY c.nome`,
      [req.user!.userId, competencia],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

/** Todas as competências de um cartão, para o seletor de fatura. */
export const listFaturas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `WITH faturas AS (${FATURA_SQL})
       SELECT competencia, fatura, encargos, estornos, lancamentos,
              (fatura + encargos) AS total_com_encargos
         FROM faturas
        WHERE of_cartao_id = $2
        ORDER BY competencia DESC`,
      [req.user!.userId, req.params.id],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * Só apelido e cor: o resto vem da Pluggy e é sobrescrito a cada sync, então
 * deixar editar daria a impressão falsa de que a mudança persiste.
 */
export const updateCartao = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { apelido, cor, dia_fechamento_manual, dia_vencimento_manual } =
      req.body;
    // Os dias vão em colunas _manual próprias: o sync sobrescreve as
    // automáticas e apagaria o que o usuário digitou.
    const { rows } = await pool.query(
      `UPDATE of_cartoes
          SET apelido               = COALESCE($3, apelido),
              cor                   = COALESCE($4, cor),
              dia_fechamento_manual = COALESCE($5, dia_fechamento_manual),
              dia_vencimento_manual = COALESCE($6, dia_vencimento_manual)
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [
        req.params.id,
        req.user!.userId,
        apelido ?? null,
        cor ?? null,
        dia_fechamento_manual ?? null,
        dia_vencimento_manual ?? null,
      ],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const updateConta = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { apelido, cor } = req.body;
    const { rows } = await pool.query(
      `UPDATE of_contas
          SET apelido = COALESCE($3, apelido),
              cor     = COALESCE($4, cor)
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [req.params.id, req.user!.userId, apelido ?? null, cor ?? null],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Conta não encontrada" });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── extrato ──────────────────────────────────────────────────────────────────

export const listTransacoes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const { destino, tipo, of_cartao_id, of_conta_id, de, ate, busca } =
      req.query as Record<string, string | undefined>;

    const filtros = [
      "t.user_id = $1",
      "($2::of_destino_enum IS NULL OR t.destino = $2::of_destino_enum)",
      "($3::of_tipo_transacao_enum IS NULL OR t.tipo = $3::of_tipo_transacao_enum)",
      "($4::uuid IS NULL OR t.of_cartao_id = $4::uuid)",
      "($5::uuid IS NULL OR t.of_conta_id  = $5::uuid)",
      "($6::date IS NULL OR t.data >= $6::date)",
      "($7::date IS NULL OR t.data <= $7::date)",
      "($8::text IS NULL OR t.descricao ILIKE '%' || $8 || '%')",
    ].join(" AND ");

    const params = [
      req.user!.userId,
      destino ?? null,
      tipo ?? null,
      of_cartao_id ?? null,
      of_conta_id ?? null,
      de ?? null,
      ate ?? null,
      busca ?? null,
    ];

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM of_transacoes t WHERE ${filtros}`,
        params,
      ),
      pool.query(
        `SELECT t.*, cat.nome AS categoria_nome, cat.cor AS categoria_cor,
                ct.nome AS cartao_nome, ct.apelido AS cartao_apelido,
                co.nome AS conta_nome, co.apelido AS conta_apelido
           FROM of_transacoes t
           LEFT JOIN categorias  cat ON cat.id = t.categoria_id
           LEFT JOIN of_cartoes  ct  ON ct.id  = t.of_cartao_id
           LEFT JOIN of_contas   co  ON co.id  = t.of_conta_id
          WHERE ${filtros}
          ORDER BY t.data DESC, t.created_at DESC
          LIMIT $9 OFFSET $10`,
        [...params, limit, offset],
      ),
    ]);

    res.json(paginated(rows, total[0].count, page, limit));
  } catch (err) {
    next(err);
  }
};

// ── classificação ────────────────────────────────────────────────────────────

/**
 * Aplica o destino escolhido criando ou removendo a linha derivada em
 * of_gastos / of_renda. Mover de gasto para renda apaga o gasto e vice-versa,
 * senão a transação apareceria nos dois relatórios.
 */
const aplicarDestino = async (
  db: PoolClient,
  userId: string,
  transacaoId: string,
  destino: string,
  categoriaId: number | null,
): Promise<void> => {
  await db.query(
    `UPDATE of_transacoes
        SET destino      = $3::of_destino_enum,
            categoria_id = COALESCE($4, categoria_id)
      WHERE id = $1 AND user_id = $2`,
    [transacaoId, userId, destino, categoriaId],
  );

  if (destino !== "gasto") {
    await db.query(
      "DELETE FROM of_gastos WHERE of_transacao_id = $1 AND user_id = $2",
      [transacaoId, userId],
    );
  }
  if (destino !== "renda") {
    await db.query(
      "DELETE FROM of_renda WHERE of_transacao_id = $1 AND user_id = $2",
      [transacaoId, userId],
    );
  }

  if (destino === "gasto") {
    await db.query(
      `INSERT INTO of_gastos (
         user_id, of_transacao_id, of_conta_id, of_cartao_id,
         descricao, valor, categoria_id, data_gasto, status
       )
       SELECT t.user_id, t.id, t.of_conta_id, t.of_cartao_id,
              t.descricao, t.valor, t.categoria_id, t.data, t.status
         FROM of_transacoes t
        WHERE t.id = $1 AND t.user_id = $2 AND t.valor > 0
       ON CONFLICT (of_transacao_id) DO UPDATE SET
         categoria_id = EXCLUDED.categoria_id,
         valor        = EXCLUDED.valor,
         updated_at   = NOW()`,
      [transacaoId, userId],
    );
  }

  if (destino === "renda") {
    await db.query(
      `INSERT INTO of_renda (
         user_id, of_transacao_id, of_conta_id,
         descricao, valor, categoria_id, data_renda
       )
       SELECT t.user_id, t.id, t.of_conta_id,
              t.descricao, t.valor, t.categoria_id, t.data
         FROM of_transacoes t
        WHERE t.id = $1 AND t.user_id = $2 AND t.valor > 0
       ON CONFLICT (of_transacao_id) DO UPDATE SET
         categoria_id = EXCLUDED.categoria_id,
         valor        = EXCLUDED.valor,
         updated_at   = NOW()`,
      [transacaoId, userId],
    );
  }
};

/** Classifica uma ou várias transações na mesma chamada (a tela envia em lote). */
export const classificar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const db = await pool.connect();
  try {
    const userId = req.user!.userId;
    const itens: { id: string; destino: string; categoria_id?: number }[] =
      req.body.itens;

    const { rows: existentes } = await db.query(
      "SELECT id FROM of_transacoes WHERE user_id = $1 AND id = ANY($2::uuid[])",
      [userId, itens.map((i) => i.id)],
    );
    if (existentes.length !== itens.length) {
      res.status(404).json({ error: "Transação não encontrada" });
      return;
    }

    await db.query("BEGIN");
    try {
      for (const item of itens) {
        await aplicarDestino(
          db,
          userId,
          item.id,
          item.destino,
          item.categoria_id ?? null,
        );
      }
      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }

    res.json({ data: { classificadas: itens.length } });
  } catch (err) {
    next(err);
  } finally {
    db.release();
  }
};

// ── gastos e renda ───────────────────────────────────────────────────────────

export const listGastos = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const { competencia, de, ate, categoria_id, of_cartao_id } =
      req.query as Record<string, string | undefined>;

    // competencia agrupa pela fatura (uma compra de 28/08 pode cair em
    // setembro); de/ate continuam disponíveis para filtrar pela data real.
    const filtros = [
      "g.user_id = $1",
      "($2::date IS NULL OR g.competencia = $2::date)",
      "($3::date IS NULL OR g.data_gasto >= $3::date)",
      "($4::date IS NULL OR g.data_gasto <= $4::date)",
      "($5::int  IS NULL OR g.categoria_id = $5::int)",
      "($6::uuid IS NULL OR g.of_cartao_id = $6::uuid)",
    ].join(" AND ");

    const params = [
      req.user!.userId,
      competencia ?? null,
      de ?? null,
      ate ?? null,
      categoria_id ?? null,
      of_cartao_id ?? null,
    ];

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(SUM(g.valor), 0)
                  - COALESCE((
                      SELECT SUM(t.valor) FROM of_transacoes t
                       WHERE t.user_id = g.user_id
                         AND t.of_cartao_id IS NOT NULL
                         AND t.tipo = 'credito'
                         AND t.destino <> 'ignorado'
                         AND ($2::date IS NULL OR t.competencia = $2::date)
                    ), 0) AS soma,
                COALESCE(SUM(g.valor) FILTER (WHERE g.encargo), 0)     AS soma_encargos,
                COALESCE(SUM(g.valor) FILTER (WHERE NOT g.encargo), 0) AS soma_sem_encargos,
                -- Estorno é crédito, então não existe em of_gastos. Descontá-lo
                -- aqui é o que faz este total bater com a fatura da página de
                -- Cartões, que usa FATURA_SQL.
                COALESCE(SUM(g.valor) FILTER (WHERE g.of_cartao_id IS NOT NULL AND NOT g.encargo), 0)
                  - COALESCE((
                      SELECT SUM(t.valor) FROM of_transacoes t
                       WHERE t.user_id = g.user_id
                         AND t.of_cartao_id IS NOT NULL
                         AND t.tipo = 'credito'
                         AND t.destino <> 'ignorado'
                         AND ($2::date IS NULL OR t.competencia = $2::date)
                    ), 0) AS soma_cartao,
                COALESCE(SUM(g.valor) FILTER (WHERE g.of_conta_id IS NOT NULL), 0) AS soma_conta
           FROM of_gastos g WHERE ${filtros}
          GROUP BY g.user_id`,
        params,
      ),
      pool.query(
        `SELECT g.*, cat.nome AS categoria_nome, cat.cor AS categoria_cor,
                cat.icone AS categoria_icone,
                ct.nome AS cartao_nome, ct.apelido AS cartao_apelido,
                a.nome AS assinatura_nome
           FROM of_gastos g
           LEFT JOIN categorias     cat ON cat.id = g.categoria_id
           LEFT JOIN of_cartoes     ct  ON ct.id  = g.of_cartao_id
           LEFT JOIN of_assinaturas a   ON a.id   = g.of_assinatura_id
          WHERE ${filtros}
          ORDER BY g.data_gasto DESC, g.created_at DESC
          LIMIT $7 OFFSET $8`,
        [...params, limit, offset],
      ),
    ]);

    // Parcelas que ainda vão cair nesse mês. Só fazem sentido com uma
    // competência escolhida; num intervalo aberto não há mês para projetar.
    const projetados = competencia
      ? await listGastosProjetados(req.user!.userId, competencia)
      : [];
    const somaProjetada = projetados.reduce(
      (acc, p) => acc + Number(p.valor),
      0,
    );

    // O GROUP BY não devolve linha quando o filtro não casa nada, então os
    // totais precisam de um zero explícito.
    const t = total[0] ?? {};
    res.json({
      ...paginated(rows, Number(t.count ?? 0), page, limit),
      soma: Number(t.soma ?? 0),
      soma_encargos: Number(t.soma_encargos ?? 0),
      soma_sem_encargos: Number(t.soma_sem_encargos ?? 0),
      soma_cartao: Number(t.soma_cartao ?? 0),
      soma_conta: Number(t.soma_conta ?? 0),
      projetados,
      soma_projetada: Number(somaProjetada.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
};

/** Edição manual do que veio do banco: categoria e observação. */
export const updateGasto = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const db = await pool.connect();
  try {
    const { categoria_id, observacoes } = req.body;
    const { rows } = await db.query(
      `UPDATE of_gastos
          SET categoria_id = COALESCE($3, categoria_id),
              observacoes  = COALESCE($4, observacoes)
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
      [req.params.id, req.user!.userId, categoria_id ?? null, observacoes ?? null],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Gasto não encontrado" });
      return;
    }
    // Mantém a transação de origem coerente: o extrato mostra a mesma categoria.
    if (categoria_id) {
      await db.query(
        "UPDATE of_transacoes SET categoria_id = $3 WHERE id = $1 AND user_id = $2",
        [rows[0].of_transacao_id, req.user!.userId, categoria_id],
      );
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  } finally {
    db.release();
  }
};

/**
 * Meses disponíveis para o seletor da página de Gastos.
 *
 * Inclui os meses à frente que só têm parcela projetada: sem eles o usuário
 * não conseguiria navegar até dezembro para ver o que já está comprometido.
 */
export const listCompetencias = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `WITH reais AS (
         SELECT g.competencia,
                COALESCE(SUM(g.valor) FILTER (WHERE NOT g.encargo), 0)::numeric(14,2) AS total,
                COALESCE(SUM(g.valor) FILTER (WHERE g.encargo), 0)::numeric(14,2)     AS encargos,
                COUNT(*)::int AS lancamentos,
                0::numeric(14,2) AS total_projetado,
                0 AS lancamentos_projetados
           FROM of_gastos g
          WHERE g.user_id = $1 AND g.competencia IS NOT NULL
          GROUP BY g.competencia
       ),
       projetadas AS (
         SELECT p.competencia,
                0::numeric(14,2) AS total,
                0::numeric(14,2) AS encargos,
                0 AS lancamentos,
                SUM(p.valor)::numeric(14,2) AS total_projetado,
                COUNT(*)::int AS lancamentos_projetados
           FROM (${PROJECAO_PARCELAS_SQL}) p
          GROUP BY p.competencia
       )
       SELECT competencia,
              SUM(total)::numeric(14,2)           AS total,
              SUM(encargos)::numeric(14,2)        AS encargos,
              SUM(lancamentos)::int               AS lancamentos,
              SUM(total_projetado)::numeric(14,2) AS total_projetado,
              SUM(lancamentos_projetados)::int    AS lancamentos_projetados
         FROM (SELECT * FROM reais UNION ALL SELECT * FROM projetadas) u
        GROUP BY competencia
        ORDER BY competencia DESC`,
      [req.user!.userId],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * Parcelas projetadas de uma competência: o que ainda vai cair naquele mês e
 * que a Pluggy não lançou. Vêm marcadas com `projecao` para a tela nunca
 * confundi-las com gasto real.
 */
export const listGastosProjetados = async (
  userId: string,
  competencia: string,
) => {
  const { rows } = await pool.query(
    `SELECT p.descricao, p.valor, p.competencia, p.numero_parcela,
            p.total_parcelas, p.purchase_date,
            cat.nome  AS categoria_nome,
            cat.cor   AS categoria_cor,
            cat.icone AS categoria_icone,
            ct.nome    AS cartao_nome,
            ct.apelido AS cartao_apelido
       FROM (${PROJECAO_PARCELAS_SQL}) p
       LEFT JOIN categorias cat ON cat.id = p.categoria_id
       LEFT JOIN of_cartoes ct  ON ct.id  = p.of_cartao_id
      WHERE p.competencia = $2::date
      ORDER BY p.valor DESC`,
    [userId, competencia],
  );
  return rows;
};

export const listRenda = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, offset } = req.pagination!;
    const { de, ate } = req.query as Record<string, string | undefined>;

    const filtros = [
      "r.user_id = $1",
      "($2::date IS NULL OR r.data_renda >= $2::date)",
      "($3::date IS NULL OR r.data_renda <= $3::date)",
    ].join(" AND ");
    const params = [req.user!.userId, de ?? null, ate ?? null];

    const [{ rows: total }, { rows }] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(r.valor), 0) AS soma
           FROM of_renda r WHERE ${filtros}`,
        params,
      ),
      pool.query(
        `SELECT r.*, cat.nome AS categoria_nome, cat.cor AS categoria_cor,
                co.nome AS conta_nome, co.apelido AS conta_apelido
           FROM of_renda r
           LEFT JOIN categorias cat ON cat.id = r.categoria_id
           LEFT JOIN of_contas  co  ON co.id  = r.of_conta_id
          WHERE ${filtros}
          ORDER BY r.data_renda DESC
          LIMIT $4 OFFSET $5`,
        [...params, limit, offset],
      ),
    ]);

    res.json({
      ...paginated(rows, total[0].count, page, limit),
      soma: Number(total[0].soma),
    });
  } catch (err) {
    next(err);
  }
};
