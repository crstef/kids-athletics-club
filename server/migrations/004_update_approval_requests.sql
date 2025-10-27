-- Adds optional metadata columns used by the unified approval workflow
ALTER TABLE approval_requests
    ADD COLUMN IF NOT EXISTS child_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS approval_notes TEXT;
