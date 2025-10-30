-- Ensure coach_probes has the columns expected by the latest API layer
ALTER TABLE coach_probes
  ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Backfill updated_at so triggers remain consistent after schema change
UPDATE coach_probes
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;
