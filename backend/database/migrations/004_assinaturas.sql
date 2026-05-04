-- Migration 004 — Assinaturas (cobranças recorrentes mensais)
-- Uma assinatura define um gasto que se repete todo mês.
-- Ao criar, gera automaticamente N gastos futuros linkados via assinatura_id.
-- Ao cancelar, os gastos futuros pendentes são removidos.

-- ============================================================
-- TABELA: assinaturas
-- ============================================================
CREATE TABLE assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    categoria_id INTEGER REFERENCES categorias (id) ON DELETE SET NULL,
    forma_pagamento forma_pagamento_enum NOT NULL,
    cartao_id UUID REFERENCES cartoes (id) ON DELETE SET NULL,
    -- Dia do mês em que a cobrança chega (1-31)
    dia_cobranca SMALLINT NOT NULL DEFAULT 1 CHECK (dia_cobranca BETWEEN 1 AND 31),
    data_inicio DATE NOT NULL,
    data_cancelamento DATE,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Coluna: gastos.assinatura_id
-- Liga cada lançamento mensal à sua assinatura de origem
-- ============================================================
ALTER TABLE gastos
ADD COLUMN IF NOT EXISTS assinatura_id UUID REFERENCES assinaturas (id) ON DELETE SET NULL;

-- Índice para acesso rápido a todos os gastos de uma assinatura
CREATE INDEX IF NOT EXISTS idx_gastos_assinatura_id ON gastos (assinatura_id);

CREATE INDEX IF NOT EXISTS idx_assinaturas_user_id ON assinaturas (user_id);