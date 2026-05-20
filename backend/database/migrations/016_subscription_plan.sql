ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_plan       VARCHAR(10)  DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
