INSERT INTO users (name, email, password_hash, user_level, email_verified)
VALUES (
  'Admin Valora',
  'admin@valorafinancas.com',
  '$2a$12$lP8pavAkeNiCA1bcesg1eOefRRAyVcGPOUcOTidKlM3kTC3K1E/q6',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
  SET user_level = 'admin';
