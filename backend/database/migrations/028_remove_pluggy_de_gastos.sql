-- Reverte o acoplamento criado na 026/027: o Open Finance passou a viver em
-- tabelas of_* próprias, então as colunas Pluggy nas tabelas do app normal
-- viraram órfãs. Nenhuma chegou a receber dado (o sync nunca rodou).
--
-- categorias.pluggy_categorias continua: o de/para de categoria é justamente
-- o que as duas áreas compartilham.

DROP INDEX IF EXISTS idx_gastos_pluggy_transaction_id;

ALTER TABLE gastos
  DROP COLUMN IF EXISTS pluggy_transaction_id,
  DROP COLUMN IF EXISTS pluggy_account_id;

DROP INDEX IF EXISTS idx_cartoes_pluggy_account_id;

ALTER TABLE cartoes
  DROP COLUMN IF EXISTS pluggy_account_id;
