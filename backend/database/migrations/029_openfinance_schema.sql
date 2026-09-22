-- Área Open Finance. Tabelas of_* isoladas das do app normal; o único ponto
-- compartilhado é categorias, por decisão de produto.
--
-- Fluxo: o sync grava o extrato cru em of_transacoes e, pela regra de destino,
-- já cria of_gastos para as saídas. Entradas ficam como 'a_classificar' e só
-- viram of_renda por ação do usuário.

-- ============================================================
-- ENUMs
-- ============================================================

DO $$ BEGIN
  CREATE TYPE of_tipo_transacao_enum AS ENUM ('debito', 'credito');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- a_classificar = esperando decisão do usuário (entradas)
  -- ignorado      = fatura de cartão e transferência entre contas próprias,
  --                 que não são gasto nem renda e contariam em dobro
  CREATE TYPE of_destino_enum AS ENUM ('gasto', 'renda', 'ignorado', 'a_classificar');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- espelha PENDING/POSTED da Pluggy
  CREATE TYPE of_status_transacao_enum AS ENUM ('pendente', 'confirmada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE of_status_assinatura_enum AS ENUM ('sugerida', 'confirmada', 'ignorada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- of_contas — conta corrente/poupança vinda do /accounts
-- Criada automaticamente no sync; apelido e cor são editáveis.
-- ============================================================

CREATE TABLE IF NOT EXISTS of_contas (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    pluggy_item_id    UUID NOT NULL REFERENCES pluggy_items (id) ON DELETE CASCADE,
    pluggy_account_id UUID NOT NULL UNIQUE,
    nome              VARCHAR(150) NOT NULL,
    apelido           VARCHAR(100),
    cor               VARCHAR(7),
    subtipo           VARCHAR(50),
    numero            VARCHAR(50),
    saldo             NUMERIC(14, 2),
    moeda             VARCHAR(3) NOT NULL DEFAULT 'BRL',
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_of_contas_user ON of_contas (user_id);

-- ============================================================
-- of_cartoes — cartão de crédito vindo do /accounts
-- bandeira é deduzida do nome do cartão no sync.
-- ============================================================

CREATE TABLE IF NOT EXISTS of_cartoes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    pluggy_item_id    UUID NOT NULL REFERENCES pluggy_items (id) ON DELETE CASCADE,
    pluggy_account_id UUID NOT NULL UNIQUE,
    nome              VARCHAR(150) NOT NULL,
    apelido           VARCHAR(100),
    cor               VARCHAR(7),
    bandeira          bandeira_enum NOT NULL DEFAULT 'outro',
    ultimos_4_digitos VARCHAR(4),
    limite            NUMERIC(14, 2),
    fatura_atual      NUMERIC(14, 2),
    dia_fechamento    INTEGER CHECK (dia_fechamento BETWEEN 1 AND 31),
    dia_vencimento    INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_of_cartoes_user ON of_cartoes (user_id);

-- ============================================================
-- of_assinaturas — cobrança recorrente no cartão
-- status 'sugerida' vem da detecção automática; o usuário confirma ou ignora.
-- A mesma linha guarda o ignorado, para não sugerir de novo a cada sync.
-- ============================================================

CREATE TABLE IF NOT EXISTS of_assinaturas (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    nome             VARCHAR(150) NOT NULL,
    -- chave de casamento das cobranças futuras (descrição normalizada)
    padrao_descricao VARCHAR(255) NOT NULL,
    valor_medio      NUMERIC(14, 2) NOT NULL CHECK (valor_medio > 0),
    valor_ultimo     NUMERIC(14, 2),
    dia_cobranca     INTEGER CHECK (dia_cobranca BETWEEN 1 AND 31),
    categoria_id     INTEGER REFERENCES categorias (id) ON DELETE SET NULL,
    of_cartao_id     UUID REFERENCES of_cartoes (id) ON DELETE SET NULL,
    status           of_status_assinatura_enum NOT NULL DEFAULT 'sugerida',
    ocorrencias      INTEGER NOT NULL DEFAULT 0,
    ultima_cobranca  DATE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, padrao_descricao)
);

CREATE INDEX IF NOT EXISTS idx_of_assinaturas_user ON of_assinaturas (user_id, status);

-- ============================================================
-- of_transacoes — extrato cru, espelho do que a Pluggy devolve
-- Fonte da verdade da integração: of_gastos e of_renda derivam daqui.
-- ============================================================

CREATE TABLE IF NOT EXISTS of_transacoes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id               UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    pluggy_transaction_id UUID NOT NULL UNIQUE,
    of_conta_id           UUID REFERENCES of_contas (id) ON DELETE CASCADE,
    of_cartao_id          UUID REFERENCES of_cartoes (id) ON DELETE CASCADE,
    descricao             VARCHAR(255) NOT NULL,
    descricao_raw         TEXT,
    -- sempre positivo: o sinal do amount é invertido entre conta e cartão,
    -- quem define entrada/saída é a coluna tipo
    valor                 NUMERIC(14, 2) NOT NULL CHECK (valor >= 0),
    tipo                  of_tipo_transacao_enum NOT NULL,
    data                  DATE NOT NULL,
    categoria_pluggy      VARCHAR(100),
    categoria_id          INTEGER REFERENCES categorias (id) ON DELETE SET NULL,
    merchant_nome         VARCHAR(150),
    status                of_status_transacao_enum NOT NULL DEFAULT 'confirmada',
    destino               of_destino_enum NOT NULL DEFAULT 'a_classificar',
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (of_conta_id IS NOT NULL OR of_cartao_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_of_transacoes_user_data ON of_transacoes (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_of_transacoes_destino   ON of_transacoes (user_id, destino);

-- ============================================================
-- of_gastos — saídas classificadas
-- ============================================================

CREATE TABLE IF NOT EXISTS of_gastos (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    of_transacao_id  UUID NOT NULL UNIQUE REFERENCES of_transacoes (id) ON DELETE CASCADE,
    of_conta_id      UUID REFERENCES of_contas (id) ON DELETE SET NULL,
    of_cartao_id     UUID REFERENCES of_cartoes (id) ON DELETE SET NULL,
    of_assinatura_id UUID REFERENCES of_assinaturas (id) ON DELETE SET NULL,
    descricao        VARCHAR(255) NOT NULL,
    valor            NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
    categoria_id     INTEGER REFERENCES categorias (id) ON DELETE SET NULL,
    data_gasto       DATE NOT NULL,
    status           of_status_transacao_enum NOT NULL DEFAULT 'confirmada',
    observacoes      TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_of_gastos_user_data ON of_gastos (user_id, data_gasto DESC);
CREATE INDEX IF NOT EXISTS idx_of_gastos_categoria ON of_gastos (user_id, categoria_id);

-- ============================================================
-- of_renda — entradas classificadas pelo usuário
-- ============================================================

CREATE TABLE IF NOT EXISTS of_renda (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    of_transacao_id UUID NOT NULL UNIQUE REFERENCES of_transacoes (id) ON DELETE CASCADE,
    of_conta_id     UUID REFERENCES of_contas (id) ON DELETE SET NULL,
    descricao       VARCHAR(255) NOT NULL,
    valor           NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
    categoria_id    INTEGER REFERENCES categorias (id) ON DELETE SET NULL,
    data_renda      DATE NOT NULL,
    observacoes     TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_of_renda_user_data ON of_renda (user_id, data_renda DESC);

-- ============================================================
-- Triggers de updated_at (fn_update_updated_at vem da 001)
-- ============================================================

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'of_contas', 'of_cartoes', 'of_assinaturas',
    'of_transacoes', 'of_gastos', 'of_renda'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()', t, t);
  END LOOP;
END $$;

-- ============================================================
-- RLS (ver 019_enable_rls.sql)
-- ============================================================

ALTER TABLE of_contas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE of_cartoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE of_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE of_transacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE of_gastos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE of_renda       ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON of_contas, of_cartoes, of_assinaturas,
              of_transacoes, of_gastos, of_renda
  FROM anon, authenticated;
