-- Teto mensal de gastos por categoria (NULL = sem limite).
-- Alimenta o alerta de categoria estourada no sino e no dashboard.

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS limite_mensal NUMERIC(12, 2)
  CHECK (limite_mensal IS NULL OR limite_mensal > 0);
