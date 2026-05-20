-- Adiciona colunas de assinatura/trial na tabela users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_ends_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
