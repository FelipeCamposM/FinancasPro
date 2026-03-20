-- ============================================================
-- Migration 001 — Schema Inicial
-- Gerenciador de Gastos
-- ============================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMs
-- ============================================================

CREATE TYPE user_level_enum      AS ENUM ('admin', 'premium', 'free');

CREATE TYPE forma_pagamento_enum AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'outro');

CREATE TYPE tipo_pagamento_enum  AS ENUM ('a_vista', 'parcelado');

CREATE TYPE frequencia_enum      AS ENUM ('diario', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual');

CREATE TYPE status_gasto_enum    AS ENUM ('pendente', 'pago', 'cancelado');

CREATE TYPE status_parcela_enum  AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');

CREATE TYPE tipo_categoria_enum  AS ENUM ('gasto', 'renda');

CREATE TYPE tipo_renda_enum      AS ENUM ('salario', 'freelance', 'investimento', 'aluguel', 'bonus', 'outro');

CREATE TYPE bandeira_enum        AS ENUM ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'discover', 'outro');

CREATE TYPE tipo_cartao_enum     AS ENUM ('credito', 'debito', 'credito_debito');

-- ============================================================
-- TABELA: users
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT,
    user_level user_level_enum NOT NULL DEFAULT 'free',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: categorias
-- user_id = NULL → categoria global do sistema
-- user_id preenchido → categoria personalizada do usuário
-- ============================================================

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(7),
    icone VARCHAR(50),
    tipo tipo_categoria_enum NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: cartoes
-- ============================================================

CREATE TABLE cartoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    apelido VARCHAR(50) NOT NULL,
    nome_no_cartao VARCHAR(100) NOT NULL,
    ultimos_4_digitos CHAR(4) NOT NULL,
    bandeira bandeira_enum NOT NULL,
    tipo tipo_cartao_enum NOT NULL,
    cor VARCHAR(7) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    limite DECIMAL(10, 2),
    dia_fechamento SMALLINT CHECK (
        dia_fechamento BETWEEN 1 AND 31
    ),
    dia_vencimento SMALLINT CHECK (
        dia_vencimento BETWEEN 1 AND 31
    ),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: gastos
-- cartao_id → preenchido quando forma_pagamento é cartão
-- gasto_origem_id → self-reference para rastrear recorrências
-- ============================================================

CREATE TABLE gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total > 0),
    categoria_id INTEGER REFERENCES categorias (id) ON DELETE SET NULL,
    forma_pagamento forma_pagamento_enum NOT NULL,
    cartao_id UUID REFERENCES cartoes (id) ON DELETE SET NULL,
    tipo_pagamento tipo_pagamento_enum NOT NULL DEFAULT 'a_vista',
    quantidade_parcelas INTEGER NOT NULL DEFAULT 1 CHECK (quantidade_parcelas >= 1),
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    frequencia_recorrencia frequencia_enum,
    data_fim_recorrencia DATE,
    data_gasto DATE NOT NULL,
    observacoes TEXT,
    status status_gasto_enum NOT NULL DEFAULT 'pendente',
    gasto_origem_id UUID REFERENCES gastos (id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: parcelas
-- Cada linha = uma parcela individual de um gasto parcelado
-- ============================================================

CREATE TABLE parcelas (
    id SERIAL PRIMARY KEY,
    gasto_id UUID NOT NULL REFERENCES gastos (id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL CHECK (numero_parcela >= 1),
    valor_parcela DECIMAL(10, 2) NOT NULL CHECK (valor_parcela > 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status status_parcela_enum NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (gasto_id, numero_parcela)
);

-- ============================================================
-- TABELA: renda
-- mes_referencia → sempre 1º dia do mês (ex: 2026-03-01)
-- ============================================================

CREATE TABLE renda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    tipo tipo_renda_enum NOT NULL,
    origem VARCHAR(100) NOT NULL,
    categoria_id INTEGER REFERENCES categorias (id) ON DELETE SET NULL,
    mes_referencia DATE NOT NULL,
    data_recebimento DATE NOT NULL,
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    frequencia_recorrencia frequencia_enum,
    data_fim_recorrencia DATE,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_categorias_user_id ON categorias (user_id);

CREATE INDEX idx_cartoes_user_id ON cartoes (user_id);

CREATE INDEX idx_cartoes_ativo ON cartoes (ativo);

CREATE INDEX idx_gastos_user_id ON gastos (user_id);

CREATE INDEX idx_gastos_data_gasto ON gastos (data_gasto);

CREATE INDEX idx_gastos_categoria_id ON gastos (categoria_id);

CREATE INDEX idx_gastos_cartao_id ON gastos (cartao_id);

CREATE INDEX idx_gastos_status ON gastos (status);

CREATE INDEX idx_gastos_recorrente ON gastos (recorrente);

CREATE INDEX idx_parcelas_gasto_id ON parcelas (gasto_id);

CREATE INDEX idx_parcelas_data_venc ON parcelas (data_vencimento);

CREATE INDEX idx_parcelas_status ON parcelas (status);

CREATE INDEX idx_renda_user_id ON renda (user_id);

CREATE INDEX idx_renda_mes_referencia ON renda (mes_referencia);

CREATE INDEX idx_renda_tipo ON renda (tipo);

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_cartoes_updated_at
  BEFORE UPDATE ON cartoes
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_gastos_updated_at
  BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_parcelas_updated_at
  BEFORE UPDATE ON parcelas
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_renda_updated_at
  BEFORE UPDATE ON renda
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();