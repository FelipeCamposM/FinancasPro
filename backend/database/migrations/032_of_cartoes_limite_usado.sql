-- O `balance` da conta de crédito na Pluggy é o limite usado total, não a
-- fatura aberta. Guardá-lo em fatura_atual era a origem do número errado
-- (3.194,77 no lugar de 2.524,81).
--
-- Agora o campo diz o que ele é, e a fatura passa a ser calculada a partir das
-- transações da competência — por isso deixa de ser coluna.

ALTER TABLE of_cartoes
  ADD COLUMN IF NOT EXISTS limite_usado NUMERIC(14, 2);

UPDATE of_cartoes
   SET limite_usado = fatura_atual
 WHERE limite_usado IS NULL;

ALTER TABLE of_cartoes
  DROP COLUMN IF EXISTS fatura_atual;
