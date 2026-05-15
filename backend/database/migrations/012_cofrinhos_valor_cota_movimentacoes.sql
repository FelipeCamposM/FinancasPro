-- Adicionar valor_cota para registrar preço da cota nas ações
ALTER TABLE cofrinhos ADD COLUMN IF NOT EXISTS valor_cota DECIMAL(12,4);

-- Migrar tipo='objetivo' → tipo='conta' (objetivo vira feature opcional, não tipo separado)
UPDATE cofrinhos SET tipo = 'conta' WHERE tipo = 'objetivo';

-- Histórico de movimentações (depósitos e adição de cotas)
CREATE TABLE IF NOT EXISTS cofrinho_movimentacoes (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cofrinho_id      UUID          NOT NULL REFERENCES cofrinhos(id) ON DELETE CASCADE,
  user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo             VARCHAR(20)   NOT NULL CHECK (tipo IN ('deposito','adicao_cotas','ajuste','retirada')),
  valor            DECIMAL(12,2),
  quantidade_cotas DECIMAL(18,6),
  valor_cota       DECIMAL(12,4),
  observacoes      TEXT,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cofrinho_mov_cofrinho_id ON cofrinho_movimentacoes(cofrinho_id);
CREATE INDEX IF NOT EXISTS idx_cofrinho_mov_user_id     ON cofrinho_movimentacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_cofrinho_mov_created_at  ON cofrinho_movimentacoes(created_at DESC);
