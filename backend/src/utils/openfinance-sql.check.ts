// Exercita todas as queries do Open Finance contra o banco real dentro de uma
// transação com ROLLBACK: nada é gravado. Pega erro de SQL (cast, coluna,
// enum) que o TypeScript não vê, já que as queries são strings.
//
// npm run check:openfinance-sql
import pool from "../config/database";
import { PROJECAO_PARCELAS_SQL } from "../controllers/openfinance-parcelas.controller";

const EMAIL = "felipecamposmacedo@gmail.com";

(async () => {
  const db = await pool.connect();
  let falhas = 0;

  const passo = async (nome: string, fn: () => Promise<unknown>) => {
    // Savepoint por passo: uma falha isolada não aborta a transação inteira.
    await db.query("SAVEPOINT sp");
    try {
      const r = (await fn()) as { rowCount?: number; rows?: unknown[] };
      await db.query("RELEASE SAVEPOINT sp");
      console.log(`  ok   ${nome} (${r?.rows?.length ?? r?.rowCount ?? 0} linhas)`);
    } catch (e) {
      await db.query("ROLLBACK TO SAVEPOINT sp");
      falhas++;
      console.log(`  FALHA ${nome}: ${(e as Error).message}`);
    }
  };

  try {
    const { rows } = await db.query("SELECT id FROM users WHERE email = $1", [EMAIL]);
    const userId = rows[0]?.id;
    if (!userId) throw new Error("usuário não encontrado");
    console.log("userId:", userId);

    await db.query("BEGIN");

    await passo("of_contas", () =>
      db.query(
        `SELECT c.*, p.apelido AS conexao_apelido, p.last_sync_at
           FROM of_contas c JOIN pluggy_items p ON p.id = c.pluggy_item_id
          WHERE c.user_id = $1 ORDER BY c.nome`,
        [userId],
      ),
    );

    // Mesma expressao de FATURA_SQL (openfinance.controller.ts). A fatura sai
    // da soma da competencia, nunca do limite usado.
    const FATURA = `
      SELECT t.of_cartao_id, t.competencia,
             (COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'debito' AND NOT t.encargo), 0)
              - COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'credito'), 0))::numeric(14,2) AS fatura,
             COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'debito' AND t.encargo), 0)::numeric(14,2) AS encargos,
             COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'credito'), 0)::numeric(14,2) AS estornos,
             COUNT(*) FILTER (WHERE t.tipo = 'debito')::int AS lancamentos
        FROM of_transacoes t
       WHERE t.user_id = $1 AND t.of_cartao_id IS NOT NULL AND t.destino <> 'ignorado'
       GROUP BY t.of_cartao_id, t.competencia`;

    await passo("of_cartoes + fatura por competencia", () =>
      db.query(
        `WITH faturas AS (${FATURA}),
         alvo AS (
           SELECT of_cartao_id, COALESCE($2::date, MAX(competencia)) AS competencia
             FROM faturas GROUP BY of_cartao_id
         )
         SELECT c.*, p.last_sync_at, a.competencia,
                COALESCE(f.fatura, 0) AS fatura_atual,
                COALESCE(f.encargos, 0) AS encargos,
                COALESCE(f.estornos, 0) AS estornos,
                COALESCE(c.limite, 0) - COALESCE(c.limite_usado, 0) AS limite_disponivel,
                COALESCE(c.dia_fechamento_manual, c.dia_fechamento) AS dia_fechamento_efetivo,
                COALESCE(c.dia_vencimento_manual, c.dia_vencimento) AS dia_vencimento_efetivo
           FROM of_cartoes c
           JOIN pluggy_items p ON p.id = c.pluggy_item_id
           LEFT JOIN alvo    a ON a.of_cartao_id = c.id
           LEFT JOIN faturas f ON f.of_cartao_id = c.id AND f.competencia = a.competencia
          WHERE c.user_id = $1 ORDER BY c.nome`,
        [userId, null],
      ),
    );

    await passo("competencias disponiveis", () =>
      db.query(
        `SELECT g.competencia,
                COALESCE(SUM(g.valor) FILTER (WHERE NOT g.encargo), 0)::numeric(14,2) AS total,
                COALESCE(SUM(g.valor) FILTER (WHERE g.encargo), 0)::numeric(14,2) AS encargos,
                COUNT(*)::int AS lancamentos
           FROM of_gastos g
          WHERE g.user_id = $1 AND g.competencia IS NOT NULL
          GROUP BY g.competencia ORDER BY g.competencia DESC`,
        [userId],
      ),
    );

    await passo("extrato (filtros)", () =>
      db.query(
        `SELECT t.*, cat.nome AS categoria_nome, ct.nome AS cartao_nome, co.nome AS conta_nome
           FROM of_transacoes t
           LEFT JOIN categorias cat ON cat.id = t.categoria_id
           LEFT JOIN of_cartoes ct  ON ct.id  = t.of_cartao_id
           LEFT JOIN of_contas  co  ON co.id  = t.of_conta_id
          WHERE t.user_id = $1
            AND ($2::of_destino_enum IS NULL OR t.destino = $2::of_destino_enum)
            AND ($3::of_tipo_transacao_enum IS NULL OR t.tipo = $3::of_tipo_transacao_enum)
            AND ($4::uuid IS NULL OR t.of_cartao_id = $4::uuid)
            AND ($5::uuid IS NULL OR t.of_conta_id  = $5::uuid)
            AND ($6::date IS NULL OR t.data >= $6::date)
            AND ($7::date IS NULL OR t.data <= $7::date)
            AND ($8::text IS NULL OR t.descricao ILIKE '%' || $8 || '%')
          ORDER BY t.data DESC LIMIT $9 OFFSET $10`,
        [userId, "gasto", "debito", null, null, null, null, "PIX", 50, 0],
      ),
    );

    await passo("of_gastos (lista por competencia)", () =>
      db.query(
        `SELECT g.*, cat.nome AS categoria_nome, ct.nome AS cartao_nome, a.nome AS assinatura_nome
           FROM of_gastos g
           LEFT JOIN categorias cat ON cat.id = g.categoria_id
           LEFT JOIN of_cartoes ct  ON ct.id  = g.of_cartao_id
           LEFT JOIN of_assinaturas a ON a.id = g.of_assinatura_id
          WHERE g.user_id = $1
            AND ($2::date IS NULL OR g.competencia = $2::date)
            AND ($3::date IS NULL OR g.data_gasto >= $3::date)
            AND ($4::date IS NULL OR g.data_gasto <= $4::date)
            AND ($5::int  IS NULL OR g.categoria_id = $5::int)
            AND ($6::uuid IS NULL OR g.of_cartao_id = $6::uuid)
          ORDER BY g.data_gasto DESC LIMIT $7 OFFSET $8`,
        [userId, null, null, null, null, null, 50, 0],
      ),
    );

    // Este total precisa bater com a fatura da pagina de Cartoes: por isso
    // desconta o estorno, que e credito e nao existe em of_gastos.
    await passo("of_gastos (totais que batem com a fatura)", () =>
      db.query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(SUM(g.valor), 0)
                  - COALESCE((SELECT SUM(t.valor) FROM of_transacoes t
                               WHERE t.user_id = g.user_id AND t.of_cartao_id IS NOT NULL
                                 AND t.tipo = 'credito' AND t.destino <> 'ignorado'
                                 AND ($2::date IS NULL OR t.competencia = $2::date)), 0) AS soma,
                COALESCE(SUM(g.valor) FILTER (WHERE g.encargo), 0) AS soma_encargos,
                COALESCE(SUM(g.valor) FILTER (WHERE g.of_cartao_id IS NOT NULL AND NOT g.encargo), 0)
                  - COALESCE((SELECT SUM(t.valor) FROM of_transacoes t
                               WHERE t.user_id = g.user_id AND t.of_cartao_id IS NOT NULL
                                 AND t.tipo = 'credito' AND t.destino <> 'ignorado'
                                 AND ($2::date IS NULL OR t.competencia = $2::date)), 0) AS soma_cartao,
                COALESCE(SUM(g.valor) FILTER (WHERE g.of_conta_id IS NOT NULL), 0) AS soma_conta
           FROM of_gastos g
          WHERE g.user_id = $1 AND ($2::date IS NULL OR g.competencia = $2::date)
          GROUP BY g.user_id`,
        [userId, null],
      ),
    );

    await passo("of_renda", () =>
      db.query(
        `SELECT r.*, cat.nome AS categoria_nome, co.nome AS conta_nome
           FROM of_renda r
           LEFT JOIN categorias cat ON cat.id = r.categoria_id
           LEFT JOIN of_contas  co  ON co.id  = r.of_conta_id
          WHERE r.user_id = $1
            AND ($2::date IS NULL OR r.data_renda >= $2::date)
            AND ($3::date IS NULL OR r.data_renda <= $3::date)
          ORDER BY r.data_renda DESC LIMIT $4 OFFSET $5`,
        [userId, null, null, 50, 0],
      ),
    );

    await passo("materializar gastos", () =>
      db.query(
        `INSERT INTO of_gastos (
           user_id, of_transacao_id, of_conta_id, of_cartao_id,
           descricao, valor, categoria_id, data_gasto, status, competencia, encargo
         )
         SELECT t.user_id, t.id, t.of_conta_id, t.of_cartao_id,
                t.descricao, t.valor, t.categoria_id, t.data, t.status,
                t.competencia, t.encargo
           FROM of_transacoes t
          WHERE t.user_id = $1 AND t.destino = 'gasto' AND t.valor > 0
         ON CONFLICT (of_transacao_id) DO UPDATE SET
           descricao = EXCLUDED.descricao, valor = EXCLUDED.valor,
           data_gasto = EXCLUDED.data_gasto, status = EXCLUDED.status,
           competencia = EXCLUDED.competencia, encargo = EXCLUDED.encargo,
           updated_at = NOW()`,
        [userId],
      ),
    );

    await passo("detectar assinaturas", () =>
      db.query(
        `WITH cobrancas AS (
           SELECT of_padrao_descricao(g.descricao) AS padrao, g.descricao, g.valor,
                  g.categoria_id, g.of_cartao_id, g.data_gasto,
                  DATE_TRUNC('month', g.data_gasto) AS mes
             FROM of_gastos g
            WHERE g.user_id = $1 AND g.of_cartao_id IS NOT NULL
         ),
         agrupado AS (
           SELECT padrao, COUNT(DISTINCT mes)::int AS meses,
                  AVG(valor)::numeric(14,2) AS valor_medio,
                  MIN(valor) AS valor_min, MAX(valor) AS valor_max,
                  MAX(data_gasto) AS ultima,
                  (ARRAY_AGG(descricao ORDER BY data_gasto DESC))[1]    AS nome,
                  (ARRAY_AGG(valor ORDER BY data_gasto DESC))[1]        AS valor_ultimo,
                  (ARRAY_AGG(categoria_id ORDER BY data_gasto DESC))[1] AS categoria_id,
                  (ARRAY_AGG(of_cartao_id ORDER BY data_gasto DESC))[1] AS of_cartao_id
             FROM cobrancas WHERE padrao <> '' GROUP BY padrao
         )
         INSERT INTO of_assinaturas (
           user_id, nome, padrao_descricao, valor_medio, valor_ultimo,
           dia_cobranca, categoria_id, of_cartao_id, ocorrencias, ultima_cobranca
         )
         SELECT $1, nome, padrao, valor_medio, valor_ultimo,
                EXTRACT(DAY FROM ultima)::int, categoria_id, of_cartao_id, meses, ultima
           FROM agrupado
          WHERE meses >= $2 AND valor_medio > 0 AND valor_max <= valor_min * (1 + $3::numeric)
         ON CONFLICT (user_id, padrao_descricao) DO UPDATE SET
           valor_medio = EXCLUDED.valor_medio, valor_ultimo = EXCLUDED.valor_ultimo,
           ocorrencias = EXCLUDED.ocorrencias, ultima_cobranca = EXCLUDED.ultima_cobranca,
           dia_cobranca = EXCLUDED.dia_cobranca, updated_at = NOW()
         RETURNING (xmax = 0) AS nova`,
        [userId, 3, 0.25],
      ),
    );

    await passo("vincular gastos a assinaturas", () =>
      db.query(
        `UPDATE of_gastos g SET of_assinatura_id = a.id
           FROM of_assinaturas a
          WHERE a.user_id = $1 AND g.user_id = $1 AND a.status = 'confirmada'
            AND g.of_assinatura_id IS DISTINCT FROM a.id
            AND of_padrao_descricao(g.descricao) = a.padrao_descricao`,
        [userId],
      ),
    );

    await passo("listar assinaturas", () =>
      db.query(
        `SELECT a.*, c.nome AS categoria_nome, ct.nome AS cartao_nome
           FROM of_assinaturas a
           LEFT JOIN categorias c  ON c.id  = a.categoria_id
           LEFT JOIN of_cartoes ct ON ct.id = a.of_cartao_id
          WHERE a.user_id = $1
            AND ($2::text IS NULL OR a.status = $2::of_status_assinatura_enum)
          ORDER BY a.status, a.valor_medio DESC`,
        [userId, null],
      ),
    );

    await passo("previsão próximo mês", () =>
      db.query(
        `SELECT a.id, a.nome, COALESCE(a.valor_ultimo, a.valor_medio) AS valor_previsto,
                (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
                 + (LEAST(COALESCE(a.dia_cobranca, 1),
                      EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 month') - INTERVAL '1 day'))::int
                    ) - 1) * INTERVAL '1 day')::date AS data_prevista
           FROM of_assinaturas a
          WHERE a.user_id = $1 AND a.status = 'confirmada'
          ORDER BY data_prevista`,
        [userId],
      ),
    );

    await passo("dashboard: por categoria", () =>
      db.query(
        `SELECT COALESCE(c.nome, 'Sem categoria') AS categoria,
                COALESCE(c.cor, '#94A3B8') AS cor,
                SUM(g.valor)::numeric(14,2) AS total, COUNT(*)::int AS lancamentos
           FROM of_gastos g LEFT JOIN categorias c ON c.id = g.categoria_id
          WHERE g.user_id = $1 AND g.competencia = DATE_TRUNC('month', CURRENT_DATE)::date
          GROUP BY c.nome, c.cor ORDER BY total DESC`,
        [userId],
      ),
    );

    await passo("dashboard: série mensal", () =>
      db.query(
        `WITH meses AS (
           SELECT generate_series(
             DATE_TRUNC('month', CURRENT_DATE) - ($2 - 1) * INTERVAL '1 month',
             DATE_TRUNC('month', CURRENT_DATE), INTERVAL '1 month')::date AS mes
         )
         SELECT m.mes,
                COALESCE((SELECT SUM(valor) FROM of_gastos g
                           WHERE g.user_id = $1 AND g.competencia = m.mes), 0)::numeric(14,2) AS saidas,
                COALESCE((SELECT SUM(valor) FROM of_renda r
                           WHERE r.user_id = $1 AND DATE_TRUNC('month', r.data_renda) = m.mes), 0)::numeric(14,2) AS entradas
           FROM meses m ORDER BY m.mes`,
        [userId, 12],
      ),
    );

    await passo("dashboard: totais e assinaturas", () =>
      db.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'confirmada')::int AS confirmadas,
                COUNT(*) FILTER (WHERE status = 'sugerida')::int   AS sugestoes,
                COALESCE(SUM(COALESCE(valor_ultimo, valor_medio))
                         FILTER (WHERE status = 'confirmada'), 0)::numeric(14,2) AS total_mensal
           FROM of_assinaturas WHERE user_id = $1 AND status IN ('confirmada', 'sugerida')`,
        [userId],
      ),
    );

    await passo("relatórios: mês x categoria", () =>
      db.query(
        `SELECT g.competencia AS mes,
                COALESCE(c.nome, 'Sem categoria') AS categoria,
                COALESCE(c.cor, '#94A3B8') AS cor, SUM(g.valor)::numeric(14,2) AS total
           FROM of_gastos g LEFT JOIN categorias c ON c.id = g.categoria_id
          WHERE g.user_id = $1 AND ($2::date IS NULL OR g.data_gasto >= $2::date)
            AND ($3::date IS NULL OR g.data_gasto <= $3::date)
          GROUP BY g.competencia, c.nome, c.cor ORDER BY mes, total DESC`,
        [userId, null, null],
      ),
    );

    await passo("relatórios: ranking", () =>
      db.query(
        `SELECT COALESCE(t.merchant_nome, of_padrao_descricao(g.descricao)) AS estabelecimento,
                SUM(g.valor)::numeric(14,2) AS total, COUNT(*)::int AS vezes, MAX(g.data_gasto) AS ultima
           FROM of_gastos g JOIN of_transacoes t ON t.id = g.of_transacao_id
          WHERE g.user_id = $1 AND ($2::date IS NULL OR g.data_gasto >= $2::date)
            AND ($3::date IS NULL OR g.data_gasto <= $3::date)
          GROUP BY estabelecimento
         HAVING COALESCE(t.merchant_nome, of_padrao_descricao(g.descricao)) <> ''
          ORDER BY total DESC LIMIT 50`,
        [userId, null, null],
      ),
    );

    await passo("relatórios: fluxo de caixa", () =>
      db.query(
        `WITH movimento AS (
           SELECT g.competencia AS mes, SUM(g.valor) AS saidas, 0::numeric AS entradas
             FROM of_gastos g
            WHERE g.user_id = $1 AND ($2::date IS NULL OR g.data_gasto >= $2::date)
              AND ($3::date IS NULL OR g.data_gasto <= $3::date)
            GROUP BY g.competencia
           UNION ALL
           SELECT DATE_TRUNC('month', r.data_renda)::date AS mes, 0::numeric AS saidas, SUM(r.valor) AS entradas
             FROM of_renda r
            WHERE r.user_id = $1 AND ($2::date IS NULL OR r.data_renda >= $2::date)
              AND ($3::date IS NULL OR r.data_renda <= $3::date)
            GROUP BY mes
         )
         SELECT mes, SUM(entradas)::numeric(14,2) AS entradas, SUM(saidas)::numeric(14,2) AS saidas,
                (SUM(entradas) - SUM(saidas))::numeric(14,2) AS resultado,
                SUM(SUM(entradas) - SUM(saidas)) OVER (ORDER BY mes)::numeric(14,2) AS acumulado
           FROM movimento GROUP BY mes ORDER BY mes`,
        [userId, null, null],
      ),
    );

    await passo("export CSV", () =>
      db.query(
        `SELECT g.data_gasto, g.descricao, g.valor,
                COALESCE(c.nome, 'Sem categoria') AS categoria,
                COALESCE(ct.apelido, ct.nome, co.apelido, co.nome) AS origem,
                a.nome AS assinatura
           FROM of_gastos g
           LEFT JOIN categorias c ON c.id = g.categoria_id
           LEFT JOIN of_cartoes ct ON ct.id = g.of_cartao_id
           LEFT JOIN of_contas co ON co.id = g.of_conta_id
           LEFT JOIN of_assinaturas a ON a.id = g.of_assinatura_id
          WHERE g.user_id = $1 AND ($2::date IS NULL OR g.data_gasto >= $2::date)
            AND ($3::date IS NULL OR g.data_gasto <= $3::date)
          ORDER BY g.data_gasto DESC`,
        [userId, null, null],
      ),
    );

    await passo("projecao de parcelas futuras", () =>
      db.query(
        `SELECT competencia, descricao, numero_parcela, total_parcelas, valor
           FROM (${PROJECAO_PARCELAS_SQL}) p
          ORDER BY competencia, valor DESC`,
        [userId],
      ),
    );

    await passo("parcelamentos (card + modal)", () =>
      db.query(
        `WITH reais AS (
           SELECT t.descricao, t.purchase_date, t.total_parcelas,
                  t.numero_parcela, t.competencia, t.valor,
                  t.of_cartao_id, t.categoria_id, FALSE AS projecao
             FROM of_transacoes t
            WHERE t.user_id = $1 AND t.tipo = 'debito'
              AND t.total_parcelas > 1 AND t.numero_parcela IS NOT NULL
              AND t.destino <> 'ignorado'
         ),
         projetadas AS (
           SELECT p.descricao, p.purchase_date, p.total_parcelas,
                  p.numero_parcela, p.competencia, p.valor,
                  p.of_cartao_id, p.categoria_id, TRUE AS projecao
             FROM (${PROJECAO_PARCELAS_SQL}) p
         ),
         todas AS (SELECT * FROM reais UNION ALL SELECT * FROM projetadas)
         SELECT t.descricao, t.purchase_date, t.total_parcelas,
                COUNT(*) FILTER (WHERE NOT t.projecao)::int AS parcelas_lancadas,
                COUNT(*) FILTER (WHERE t.projecao)::int     AS parcelas_restantes,
                SUM(t.valor)::numeric(14,2)                 AS valor_total,
                SUM(t.valor) FILTER (WHERE t.projecao)::numeric(14,2) AS falta_pagar,
                MAX(t.valor)::numeric(14,2)                 AS valor_parcela,
                MIN(t.competencia) FILTER (WHERE t.projecao) AS proxima_competencia,
                MAX(t.competencia)                          AS ultima_competencia,
                MAX(ct.apelido) AS cartao_apelido, MAX(ct.nome) AS cartao_nome,
                MAX(cat.nome) AS categoria_nome, MAX(cat.cor) AS categoria_cor,
                JSON_AGG(JSON_BUILD_OBJECT(
                  'numero_parcela', t.numero_parcela,
                  'competencia', t.competencia,
                  'valor', t.valor,
                  'projecao', t.projecao) ORDER BY t.numero_parcela) AS parcelas
           FROM todas t
           LEFT JOIN of_cartoes ct  ON ct.id  = t.of_cartao_id
           LEFT JOIN categorias cat ON cat.id = t.categoria_id
          GROUP BY t.descricao, t.purchase_date, t.total_parcelas
          ORDER BY (COUNT(*) FILTER (WHERE t.projecao)) DESC, t.purchase_date DESC`,
        [userId],
      ),
    );

    await passo("competencias com meses futuros", () =>
      db.query(
        `WITH reais AS (
           SELECT g.competencia,
                  COALESCE(SUM(g.valor) FILTER (WHERE NOT g.encargo), 0)::numeric(14,2) AS total,
                  COALESCE(SUM(g.valor) FILTER (WHERE g.encargo), 0)::numeric(14,2) AS encargos,
                  COUNT(*)::int AS lancamentos,
                  0::numeric(14,2) AS total_projetado, 0 AS lancamentos_projetados
             FROM of_gastos g
            WHERE g.user_id = $1 AND g.competencia IS NOT NULL
            GROUP BY g.competencia
         ),
         projetadas AS (
           SELECT p.competencia, 0::numeric(14,2), 0::numeric(14,2), 0,
                  SUM(p.valor)::numeric(14,2), COUNT(*)::int
             FROM (${PROJECAO_PARCELAS_SQL}) p GROUP BY p.competencia
         )
         SELECT competencia, SUM(total)::numeric(14,2) AS total,
                SUM(encargos)::numeric(14,2) AS encargos,
                SUM(lancamentos)::int AS lancamentos,
                SUM(total_projetado)::numeric(14,2) AS total_projetado,
                SUM(lancamentos_projetados)::int AS lancamentos_projetados
           FROM (SELECT * FROM reais UNION ALL SELECT * FROM projetadas) u
          GROUP BY competencia ORDER BY competencia DESC`,
        [userId],
      ),
    );

    await passo("gastos projetados de uma competencia", () =>
      db.query(
        `SELECT p.descricao, p.valor, p.competencia, p.numero_parcela,
                p.total_parcelas, p.purchase_date,
                cat.nome AS categoria_nome, cat.cor AS categoria_cor,
                cat.icone AS categoria_icone,
                ct.nome AS cartao_nome, ct.apelido AS cartao_apelido
           FROM (${PROJECAO_PARCELAS_SQL}) p
           LEFT JOIN categorias cat ON cat.id = p.categoria_id
           LEFT JOIN of_cartoes ct  ON ct.id  = p.of_cartao_id
          WHERE p.competencia = $2::date
          ORDER BY p.valor DESC`,
        [userId, "2026-11-01"],
      ),
    );

    await passo("of_padrao_descricao", async () => {
      const r = await db.query(
        "SELECT of_padrao_descricao($1) AS p1, of_padrao_descricao($2) AS p2",
        ["OPENAI *CHATGPT SUBSCR 123", "ZP*NOBRE SORVETES"],
      );
      console.log("        →", JSON.stringify(r.rows[0]));
      return r;
    });

    await db.query("ROLLBACK");
  } catch (e) {
    console.log("ERRO GERAL:", (e as Error).message);
    falhas++;
    try { await db.query("ROLLBACK"); } catch { /* já abortada */ }
  } finally {
    db.release();
    await pool.end();
  }

  console.log(falhas === 0 ? "\nTUDO OK — nada gravado (ROLLBACK)" : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})();
