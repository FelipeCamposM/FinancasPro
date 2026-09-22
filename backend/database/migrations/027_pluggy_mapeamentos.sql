-- De/para entre os dados da Pluggy e as entidades do usuário.
--
-- Optei por colunas nas tabelas existentes em vez de tabelas de junção: o
-- volume é pequeno (dezenas de categorias, poucos cartões) e assim o
-- mapeamento é editado pelos endpoints de categorias/cartões que já existem.

-- ============================================================
-- Categoria da Pluggy (inglês) → categoria do usuário
-- Uma categoria do usuário absorve várias da Pluggy.
-- ============================================================

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS pluggy_categorias TEXT[];

CREATE INDEX IF NOT EXISTS idx_categorias_pluggy
  ON categorias USING GIN (pluggy_categorias);

-- ============================================================
-- Conta da Pluggy → cartão do usuário
-- Preenchido pelo PATCH /cartoes. Sem isso o gasto importado do cartão
-- entra sem cartao_id.
-- ============================================================

ALTER TABLE cartoes
  ADD COLUMN IF NOT EXISTS pluggy_account_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cartoes_pluggy_account_id
  ON cartoes (pluggy_account_id)
  WHERE pluggy_account_id IS NOT NULL;

-- ============================================================
-- Seed do de/para para quem já tem Open Finance liberado.
-- Casa pelo nome da categoria; quem não tiver o nome exato fica sem
-- mapeamento e cai no fallback do sync.
-- ============================================================

UPDATE categorias c
   SET pluggy_categorias = m.cats
  FROM (
    VALUES
      ('Mercado',        ARRAY['Groceries', 'Supermarkets']),
      ('Alimentação',    ARRAY['Eating out', 'Food and drinks', 'Restaurants']),
      ('IFOOD/99',       ARRAY['Food delivery']),
      ('Gasolina',       ARRAY['Gas stations']),
      ('Carro',          ARRAY['Parking', 'Automotive', 'Tolls']),
      ('Uber/99',        ARRAY['Taxi and ride-hailing', 'Transportation']),
      ('Compras Online', ARRAY['Shopping', 'Online shopping', 'Marketplace']),
      ('Assinaturas',    ARRAY['Digital services', 'Streaming']),
      ('Tecnologia',     ARRAY['Electronics']),
      ('Roupa/Sapato',   ARRAY['Clothing']),
      ('Saúde',          ARRAY['Healthcare', 'Pharmacy', 'Fitness']),
      ('Educação',       ARRAY['Education']),
      ('Lazer',          ARRAY['Entertainment']),
      ('Viagem',         ARRAY['Travel', 'Airlines', 'Accommodation'])
  ) AS m (nome, cats)
 WHERE c.nome = m.nome
   AND c.tipo = 'gasto'
   AND c.pluggy_categorias IS NULL
   AND c.user_id IN (SELECT id FROM users WHERE open_finance_habilitado);
