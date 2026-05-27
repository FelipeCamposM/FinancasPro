-- ============================================================
-- Migration 021 — Adiciona last_login_at em users
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
