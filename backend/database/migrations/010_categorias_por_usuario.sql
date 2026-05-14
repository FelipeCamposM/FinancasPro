-- ============================================================
-- Migration 010 — Categorias por usuário
-- Copia as categorias globais (user_id IS NULL) para cada
-- usuário existente e remove as linhas globais compartilhadas.
-- Novos usuários recebem as categorias padrão via auth.controller.
-- ============================================================

-- 1. Copiar globais para usuários existentes (idempotente)
INSERT INTO categorias (user_id, nome, cor, icone, tipo)
SELECT u.id, c.nome, c.cor, c.icone, c.tipo
FROM users u
CROSS JOIN categorias c
WHERE c.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categorias c2
    WHERE c2.user_id = u.id
      AND c2.nome    = c.nome
      AND c2.tipo    = c.tipo
  );

-- 2. Remover categorias globais compartilhadas
DELETE FROM categorias WHERE user_id IS NULL;
