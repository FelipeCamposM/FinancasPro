-- Integração Open Finance via Pluggy (conector MeuPluggy).
--
-- A feature fica atrás de uma flag por usuário em vez de e-mail chumbado no
-- código: liberar outra conta depois vira um UPDATE, sem deploy.
--
-- O endpoint GET /v2/items da Pluggy é opt-in e está desabilitado na conta,
-- então não há como descobrir os itemId automaticamente. O usuário cadastra
-- cada conexão na mão — daí a tabela pluggy_items.

-- ============================================================
-- Flag de acesso à feature
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS open_finance_habilitado BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
   SET open_finance_habilitado = TRUE
 WHERE email = 'felipecamposmacedo@gmail.com';

-- ============================================================
-- TABELA: pluggy_items
-- Cada linha = uma conexão (itemId) do Meu Pluggy cadastrada pelo usuário
-- ============================================================

CREATE TABLE IF NOT EXISTS pluggy_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    item_id      UUID NOT NULL,
    apelido      VARCHAR(100),
    last_sync_at TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_pluggy_items_user_id ON pluggy_items (user_id);

DROP TRIGGER IF EXISTS trg_pluggy_items_updated_at ON pluggy_items;

CREATE TRIGGER trg_pluggy_items_updated_at
  BEFORE UPDATE ON pluggy_items
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- ============================================================
-- Rastreio da origem em gastos
-- Transação PENDING da Pluggy muda depois (valor e descrição), então a
-- sincronização é upsert por pluggy_transaction_id, não insert.
-- ============================================================

ALTER TABLE gastos
  ADD COLUMN IF NOT EXISTS pluggy_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS pluggy_account_id     UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gastos_pluggy_transaction_id
  ON gastos (pluggy_transaction_id)
  WHERE pluggy_transaction_id IS NOT NULL;

-- ============================================================
-- RLS (ver 019_enable_rls.sql)
-- ============================================================

ALTER TABLE pluggy_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON pluggy_items FROM anon, authenticated;
