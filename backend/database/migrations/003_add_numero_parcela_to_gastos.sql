-- Migration 003 — Adiciona numero_parcela à tabela gastos
-- Permite identificar qual parcela cada registro representa (ex: 1 de 3)

ALTER TABLE gastos
ADD COLUMN IF NOT EXISTS numero_parcela SMALLINT NOT NULL DEFAULT 1;