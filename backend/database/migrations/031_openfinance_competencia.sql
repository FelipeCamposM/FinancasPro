-- Competência da fatura e separação de encargos.
--
-- O `balance` da conta de crédito na Pluggy é o LIMITE USADO total, não a
-- fatura aberta — por isso of_cartoes.fatura_atual vinha 3.194,77 quando a
-- fatura era 2.524,81. O número correto sai da soma das transações da
-- competência, que a Pluggy informa por transação em
-- creditCardMetadata.billForecastDate.

-- ============================================================
-- Competência e encargos em of_transacoes
-- ============================================================

ALTER TABLE of_transacoes
  -- Dia 1 do mês da fatura. Para conta corrente é o mês da própria data.
  ADD COLUMN IF NOT EXISTS competencia DATE,
  -- IOF, juros, multa e anuidade: somados à parte para que a fatura exibida
  -- bata com a do app do banco sem que o valor suma do total de gastos.
  ADD COLUMN IF NOT EXISTS encargo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_of_transacoes_competencia
  ON of_transacoes (user_id, competencia);

-- ============================================================
-- Competência em of_gastos
-- A página de Gastos agrupa por ela: assim o total de setembro bate com a
-- fatura de setembro, mesmo para uma compra feita em 28/08.
-- ============================================================

ALTER TABLE of_gastos
  ADD COLUMN IF NOT EXISTS competencia DATE,
  ADD COLUMN IF NOT EXISTS encargo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_of_gastos_competencia
  ON of_gastos (user_id, competencia);

-- ============================================================
-- Fechamento e vencimento informados à mão
-- A Pluggy manda balanceDueDate mas veio com balanceCloseDate nulo. Colunas
-- separadas em vez de sobrescrever as automáticas: o valor do usuário nunca
-- é apagado pelo sync, e o efetivo é COALESCE(manual, automático).
-- ============================================================

ALTER TABLE of_cartoes
  ADD COLUMN IF NOT EXISTS dia_fechamento_manual INTEGER
    CHECK (dia_fechamento_manual IS NULL OR dia_fechamento_manual BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS dia_vencimento_manual INTEGER
    CHECK (dia_vencimento_manual IS NULL OR dia_vencimento_manual BETWEEN 1 AND 31);

-- ============================================================
-- Backfill do que já foi importado.
-- Sem o billForecastDate (que ainda não era gravado), a competência cai no
-- mês da data. O próximo sync corrige as do cartão com o valor real.
-- ============================================================

UPDATE of_transacoes
   SET competencia = DATE_TRUNC('month', data)::date
 WHERE competencia IS NULL;

UPDATE of_gastos g
   SET competencia = t.competencia
  FROM of_transacoes t
 WHERE t.id = g.of_transacao_id AND g.competencia IS NULL;
