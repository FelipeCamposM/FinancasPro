-- Enable Row-Level Security on all tables.
-- The backend connects as the postgres superuser (via pooler connection string),
-- which bypasses RLS automatically — no backend changes needed.
-- Supabase REST API (PostgREST) uses the anon/authenticated roles, which will
-- be denied access by default when RLS is enabled with no permissive policies.

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE renda                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofrinhos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofrinho_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcut_setup_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_used_emails      ENABLE ROW LEVEL SECURITY;

-- Revoke all PostgREST access explicitly as defense-in-depth
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
