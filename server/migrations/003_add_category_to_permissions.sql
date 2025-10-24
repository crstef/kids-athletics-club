-- Add category column to permissions table if it doesn't exist
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- Update existing permissions with categories based on their names
UPDATE permissions
SET category = CASE
  WHEN name LIKE 'athletes.%' THEN 'athletes'
  WHEN name LIKE 'results.%' THEN 'results'
  WHEN name LIKE 'events.%' THEN 'events'
  WHEN name LIKE 'messages.%' THEN 'messages'
  WHEN name LIKE 'access_requests.%' THEN 'access_requests'
  WHEN name LIKE 'users.%' THEN 'users'
  WHEN name LIKE 'roles.%' THEN 'roles'
  WHEN name LIKE 'permissions.%' THEN 'permissions'
  WHEN name LIKE 'dashboard.%' THEN 'dashboards'
  ELSE 'general'
END
WHERE category = 'general' OR category IS NULL;
