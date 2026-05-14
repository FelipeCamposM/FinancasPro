ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

UPDATE users
SET
  email_verified = TRUE,
  email_verified_at = COALESCE(email_verified_at, created_at, NOW())
WHERE email_verified = FALSE;

CREATE TABLE IF NOT EXISTS email_auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(32) NOT NULL CHECK (purpose IN ('email_verification', 'login')),
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_auth_codes_user_purpose
  ON email_auth_codes(user_id, purpose, used, expires_at);

CREATE INDEX IF NOT EXISTS idx_email_auth_codes_code_hash
  ON email_auth_codes(code_hash);
