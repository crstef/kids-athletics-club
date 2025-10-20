-- Insert admin user into kids_athletics database
-- Password: admin123 (SHA256 hash)
-- Email: admin@kidsathletic.com

INSERT INTO users (
    id,
    email,
    password,
    first_name,
    last_name,
    role,
    is_active,
    needs_approval,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@kidsathletic.com',
    '0192023a7bbd73250516f069df18b500', -- SHA256 hash of "admin123"
    'Admin',
    'User',
    'admin',
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verify insertion
SELECT id, email, first_name, last_name, role, is_active FROM users WHERE email = 'admin@kidsathletic.com';
