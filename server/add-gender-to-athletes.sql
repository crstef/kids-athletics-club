-- Add gender column to athletes table
-- Run this on existing database: psql -d jmwclpii_kids_athletic -f add-gender-to-athletes.sql

ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('M', 'F'));

-- Optional: Set default gender for existing athletes (if any)
-- UPDATE athletes SET gender = 'M' WHERE gender IS NULL;

COMMENT ON COLUMN athletes.gender IS 'Gender of athlete: M (Male) or F (Female)';
