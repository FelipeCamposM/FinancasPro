-- A 019 habilitou RLS nas tabelas existentes na época, mas email_auth_codes
-- (códigos de verificação e de login por e-mail) ficou de fora. Sem isso,
-- qualquer role do PostgREST com grant futuro leria códigos de autenticação.

ALTER TABLE email_auth_codes ENABLE ROW LEVEL SECURITY;

-- Defesa em profundidade: reforça o revoke da 019 e cobre tabelas criadas depois
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
