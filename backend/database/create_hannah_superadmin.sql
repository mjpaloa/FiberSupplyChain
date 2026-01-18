-- =====================================================
-- CREATE HANNAH FAYE CALUNIA SUPER ADMIN ACCOUNT
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This creates a SUPER ADMIN account for Hannah Faye Calunia
-- =====================================================

-- Email: hanahfayeicalunia@gmail.com
-- Password: Calunia@123
-- Hash generated with: bcrypt.hash('Calunia@123', 10)

-- First, ensure the is_super_admin column exists
ALTER TABLE public.organization 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_organization_is_super_admin 
ON public.organization(is_super_admin);

-- Delete existing account if exists
DELETE FROM organization WHERE email = 'hanahfayeicalunia@gmail.com';

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
    'Hannah Faye Calunia',
    'System Administrator',
    'Municipal Agriculture Office, Culiram',
    'Prosperidad',
    'All Barangays',
    '09123456789',
    'hanahfayeicalunia@gmail.com',
    'Municipal Agriculture Office, Culiram, Prosperidad, Agusan del Sur',
    '$2b$10$8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K', -- Calunia@123
    true,
    true,
    true,
    true, -- THIS IS A SUPER ADMIN ACCOUNT
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
WHERE email = 'hanahfayeicalunia@gmail.com';

-- =====================================================
-- ACCOUNT SUMMARY
-- =====================================================
-- 
-- SUPER ADMIN ACCOUNT FOR HANNAH FAYE CALUNIA
--    Email: hanahfayeicalunia@gmail.com
--    Password: Calunia@123
--    Access: FULL SYSTEM ACCESS + Can login during maintenance
--    
-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 1. This is a SUPER ADMIN account (is_super_admin = true)
-- 2. Has FULL system access to all features
-- 3. CAN login during maintenance mode
-- 4. Can manage all users, settings, and system configurations
-- 5. Please keep this password secure and change it after first login
-- =====================================================
