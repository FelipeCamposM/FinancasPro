-- Migration 006 — API Key permanente por usuário
-- Usada pelo endpoint /api/gastos/atalho (iPhone Shortcuts) sem expiração.
-- O usuário pode rotacionar a key pelo painel web a qualquer momento.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS api_key UUID UNIQUE DEFAULT gen_random_uuid ();

-- Garante que usuários existentes sem api_key recebam uma
UPDATE users SET api_key = gen_random_uuid () WHERE api_key IS NULL;

-- Não pode ser NULL após o backfill
ALTER TABLE users ALTER COLUMN api_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_api_key ON users (api_key);