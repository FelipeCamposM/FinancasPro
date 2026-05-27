-- ============================================================
-- Migration 022 — Rastreia gastos criados via atalho iPhone
-- ============================================================

ALTER TABLE gastos
  ADD COLUMN IF NOT EXISTS via_atalho BOOLEAN NOT NULL DEFAULT FALSE;
