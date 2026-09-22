-- Normalização da descrição usada para agrupar cobranças da mesma assinatura
-- em meses diferentes.
--
-- A extensão unaccent não está disponível neste banco, então os acentos saem
-- por TRANSLATE. Fica como função para que a detecção e a vinculação usem
-- exatamente a mesma regra — duas cópias do REGEXP divergiriam com o tempo.
--
-- Tira números variáveis (data, parcela, id de pedido) mas mantém o nome do
-- estabelecimento: sem isso "UBER *TRIP 1234" e "UBER *TRIP 5678" virariam a
-- mesma assinatura.

CREATE OR REPLACE FUNCTION of_padrao_descricao(descricao TEXT)
RETURNS TEXT AS $$
  SELECT LEFT(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            TRANSLATE(
              UPPER(COALESCE(descricao, '')),
              'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
              'AAAAAEEEEIIIIOOOOOUUUUCN'
            ),
            '[0-9]+', '', 'g'
          ),
          '[^A-Z ]+', ' ', 'g'
        ),
        '\s+', ' ', 'g'
      )
    ),
    255
  );
$$ LANGUAGE SQL IMMUTABLE;
