-- ============================================================
-- Migration 009 - Cofrinhos
-- Planejamento manual de investimentos, contas e objetivos
-- ============================================================

CREATE TABLE IF NOT EXISTS cofrinhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('acao', 'conta', 'objetivo')),
    nome VARCHAR(120) NOT NULL,
    saldo_atual DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (saldo_atual >= 0),
    meta_valor DECIMAL(12, 2) CHECK (meta_valor IS NULL OR meta_valor > 0),
    ticker VARCHAR(12),
    quantidade_cotas DECIMAL(18, 6) CHECK (
        quantidade_cotas IS NULL OR quantidade_cotas > 0
    ),
    instituicao VARCHAR(120),
    data_alvo DATE,
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cofrinhos_acao
      CHECK (tipo <> 'acao' OR (ticker IS NOT NULL AND quantidade_cotas IS NOT NULL)),
    CONSTRAINT chk_cofrinhos_objetivo
      CHECK (tipo <> 'objetivo' OR meta_valor IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_cofrinhos_user_id ON cofrinhos (user_id);
CREATE INDEX IF NOT EXISTS idx_cofrinhos_tipo ON cofrinhos (tipo);
CREATE INDEX IF NOT EXISTS idx_cofrinhos_ativo ON cofrinhos (ativo);

DROP TRIGGER IF EXISTS trg_cofrinhos_updated_at ON cofrinhos;
CREATE TRIGGER trg_cofrinhos_updated_at
  BEFORE UPDATE ON cofrinhos
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
