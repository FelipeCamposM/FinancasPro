ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ;
