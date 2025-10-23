-- Add parent_id column to athletes and supporting constraints/indexes

-- Add column (compatible with older Postgres: do not use IF NOT EXISTS on ALTER TABLE itself)
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS parent_id UUID;

-- Add FK constraint if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_athletes_parent' AND table_name = 'athletes'
  ) THEN
    ALTER TABLE athletes
      ADD CONSTRAINT fk_athletes_parent FOREIGN KEY (parent_id)
      REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for faster lookups by parent
CREATE INDEX IF NOT EXISTS idx_athletes_parent_id ON athletes(parent_id);
