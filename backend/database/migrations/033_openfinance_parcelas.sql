-- Parcelamento e tipo de operação do cartão.
--
-- A Pluggy manda em creditCardMetadata: purchaseDate, installmentNumber,
-- totalInstallments e billId — nada disso estava sendo gravado. Sem eles:
--
--  * a última parcela de uma compra vem com billForecastDate '0001-01' (a
--    fatura futura ainda não existe) e caía no mês da data da compra, o que
--    fazia a parcela aparecer como se fosse uma segunda cobrança no mesmo mês;
--  * uma compra em 3x com valor fixo era detectada como assinatura.

ALTER TABLE of_transacoes
  -- Data da compra original. Numa parcela ela é diferente de `data`, que é a
  -- data do lançamento daquela parcela.
  ADD COLUMN IF NOT EXISTS purchase_date   DATE,
  ADD COLUMN IF NOT EXISTS numero_parcela  INTEGER,
  ADD COLUMN IF NOT EXISTS total_parcelas  INTEGER,
  -- Identificador da fatura fechada na Pluggy; nulo enquanto a fatura estiver
  -- em aberto.
  ADD COLUMN IF NOT EXISTS bill_id         UUID,
  -- PAGAMENTO, ESTORNO, OUTROS
  ADD COLUMN IF NOT EXISTS operation_type  VARCHAR(30);

ALTER TABLE of_gastos
  ADD COLUMN IF NOT EXISTS numero_parcela  INTEGER,
  ADD COLUMN IF NOT EXISTS total_parcelas  INTEGER;

-- Agrupar as parcelas da mesma compra na tela de gastos.
CREATE INDEX IF NOT EXISTS idx_of_transacoes_parcela
  ON of_transacoes (user_id, purchase_date)
  WHERE total_parcelas > 1;
