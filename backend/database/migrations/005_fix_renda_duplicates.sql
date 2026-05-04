-- Migration 005: Fix renda duplicate instances and add unique constraint
-- Removes duplicate instances (keeps the oldest) and prevents future duplicates at DB level.

-- Step 1: Normalize mes_referencia to first-of-month for existing instances
-- (autoLancarMes always inserts YYYY-MM-01, so this just ensures consistency)
UPDATE renda
SET
    mes_referencia = DATE_TRUNC('month', mes_referencia)
WHERE
    renda_origem_id IS NOT NULL;

-- Step 2: Remove duplicates, keeping only the earliest created row per (renda_origem_id, mes_referencia)
DELETE FROM renda
WHERE
    id IN (
        SELECT id
        FROM (
                SELECT id, ROW_NUMBER() OVER (
                        PARTITION BY
                            renda_origem_id, mes_referencia
                        ORDER BY created_at ASC
                    ) AS rn
                FROM renda
                WHERE
                    renda_origem_id IS NOT NULL
            ) ranked
        WHERE
            rn > 1
    );

-- Step 3: Add partial unique index to prevent future duplicate instances at DB level.
-- mes_referencia is always stored as the first day of the month (YYYY-MM-01),
-- so a plain unique index on (renda_origem_id, mes_referencia) is sufficient.
CREATE UNIQUE INDEX IF NOT EXISTS idx_renda_unique_instancia_mes ON renda (
    renda_origem_id,
    mes_referencia
)
WHERE
    renda_origem_id IS NOT NULL;