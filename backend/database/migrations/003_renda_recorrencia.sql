-- ============================================================
-- Migration 003 — Renda: coluna renda_origem_id (auto-referência)
-- Permite rastrear instâncias lançadas a partir de um template recorrente
-- ============================================================

ALTER TABLE renda
ADD COLUMN renda_origem_id UUID REFERENCES renda (id) ON DELETE SET NULL;

CREATE INDEX idx_renda_origem_id ON renda (renda_origem_id);