-- Add date_of_birth column to athletes table
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Update existing athletes to calculate date_of_birth from age (approximate)
-- This will set date_of_birth to January 1st of the birth year calculated from current age
UPDATE athletes 
SET date_of_birth = DATE(CONCAT((EXTRACT(YEAR FROM CURRENT_DATE) - age)::TEXT, '-01-01'))
WHERE date_of_birth IS NULL;

-- Make date_of_birth NOT NULL after populating existing records
ALTER TABLE athletes ALTER COLUMN date_of_birth SET NOT NULL;
