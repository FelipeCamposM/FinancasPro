-- Preferências do usuário (alertas, comportamento de abertura de mês etc.)
-- JSONB para permitir novas chaves sem migration a cada opção nova.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferencias JSONB NOT NULL DEFAULT '{}'::jsonb;
