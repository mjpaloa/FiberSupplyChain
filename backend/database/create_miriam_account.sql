-- =====================================================
-- CREATE MIRIAM MAO ADMIN ACCOUNT
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This creates a MAO Admin account for Miriam
-- =====================================================

-- Email: miriam@gmail.com
-- Password: Miriam@123
-- Hash generated with: bcrypt.hash('Miriam@123', 10)

-- Delete existing account if exists
DELETE FROM organization WHERE email = 'miriam@gmail.com';

INSERT INTO organization (
    officer_id,
    full_name,
    position,
    office_name,
    assigned_municipality,
    assigned_barangay,
    contact_number,
    email,
    address,
    password_hash,
    is_active,
    is_verified,
    profile_completed,
    is_super_admin,
    verification_status,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'Miriam',
    'Municipal Agriculture Officer',
    'Municipal Agriculture Office, Culiram',
    'Prosperidad',
    'Culiram',
    '09123456789',
    'miriam@gmail.com',
    'Municipal Agriculture Office, Culiram, Prosperidad, Agusan del Sur',
    '$2b$10$Wn6d.PDjp6S2zutjHvMcRuRGKecez6Oqf4NkQXg.3MJyUgEqrDhGe', -- Miriam@123
    true,
    true,
    true,
    false, -- Regular admin (not super admin)
    'verified',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- VERIFY THE ACCOUNT WAS CREATED
-- =====================================================
SELECT 
    officer_id,
    full_name,
    position,
    email,
    is_active,
    is_verified,
    is_super_admin,
    profile_completed,
    created_at
FROM organization
WHERE email = 'miriam@gmail.com';

-- =====================================================
-- ACCOUNT SUMMARY
-- =====================================================
-- 
-- MAO ADMIN ACCOUNT FOR MIRIAM
--    Email: miriam@gmail.com
--    Password: Miriam@123
--    Access: Regular MAO officer access
--    
-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 1. This is a regular admin account (not super admin)
-- 2. Can access all MAO dashboard features
-- 3. Cannot login during maintenance mode
-- 4. Please change the password after first login
-- =====================================================
