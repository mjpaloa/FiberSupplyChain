-- Migration: Add deactivation fields to support 3-day grace period deletion
-- This migration adds deactivation tracking fields to farmers, buyers, and association_officers tables

-- Add deactivation fields to farmers table
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_by TEXT,
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reactivated_by TEXT;

-- Add deactivation fields to buyers table
ALTER TABLE buyers 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_by TEXT,
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reactivated_by TEXT;

-- Add deactivation fields to association_officers table
ALTER TABLE association_officers 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_by TEXT,
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reactivated_by TEXT;

-- Create indexes for efficient queries on deactivated users
CREATE INDEX IF NOT EXISTS idx_farmers_deactivated ON farmers(is_active, deactivated_at) WHERE deactivated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buyers_deactivated ON buyers(is_active, deactivated_at) WHERE deactivated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_association_officers_deactivated ON association_officers(is_active, deactivated_at) WHERE deactivated_at IS NOT NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN farmers.deactivated_at IS 'Timestamp when the farmer account was deactivated. Used for 3-day grace period before permanent deletion.';
COMMENT ON COLUMN farmers.deactivated_by IS 'ID of the officer who deactivated this farmer account.';
COMMENT ON COLUMN farmers.reactivated_at IS 'Timestamp when the farmer account was last reactivated.';
COMMENT ON COLUMN farmers.reactivated_by IS 'ID of the officer who reactivated this farmer account.';

COMMENT ON COLUMN buyers.deactivated_at IS 'Timestamp when the buyer account was deactivated. Used for 3-day grace period before permanent deletion.';
COMMENT ON COLUMN buyers.deactivated_by IS 'ID of the officer who deactivated this buyer account.';
COMMENT ON COLUMN buyers.reactivated_at IS 'Timestamp when the buyer account was last reactivated.';
COMMENT ON COLUMN buyers.reactivated_by IS 'ID of the officer who reactivated this buyer account.';

COMMENT ON COLUMN association_officers.deactivated_at IS 'Timestamp when the association officer account was deactivated. Used for 3-day grace period before permanent deletion.';
COMMENT ON COLUMN association_officers.deactivated_by IS 'ID of the officer who deactivated this association officer account.';
COMMENT ON COLUMN association_officers.reactivated_at IS 'Timestamp when the association officer account was last reactivated.';
COMMENT ON COLUMN association_officers.reactivated_by IS 'ID of the officer who reactivated this association officer account.';

-- Create a function to automatically clean up expired deactivated users
CREATE OR REPLACE FUNCTION cleanup_expired_deactivated_users()
RETURNS INTEGER AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Calculate cutoff date (3 days ago)
    cutoff_date := NOW() - INTERVAL '3 days';
    
    -- Delete expired farmers
    DELETE FROM farmers 
    WHERE is_active = false 
    AND deactivated_at IS NOT NULL 
    AND deactivated_at < cutoff_date;
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete expired buyers
    DELETE FROM buyers 
    WHERE is_active = false 
    AND deactivated_at IS NOT NULL 
    AND deactivated_at < cutoff_date;
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete expired association officers
    DELETE FROM association_officers 
    WHERE is_active = false 
    AND deactivated_at IS NOT NULL 
    AND deactivated_at < cutoff_date;
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Log the cleanup operation
    INSERT INTO system_logs (log_type, message, created_at) 
    VALUES ('cleanup', 'Automatic cleanup deleted ' || deleted_count || ' expired deactivated users', NOW())
    ON CONFLICT DO NOTHING; -- In case system_logs table doesn't exist
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the cleanup function
COMMENT ON FUNCTION cleanup_expired_deactivated_users() IS 'Automatically deletes users who have been deactivated for more than 3 days. Returns the number of deleted users.';

-- Optional: Create a view to easily see all deactivated users with expiry information
CREATE OR REPLACE VIEW deactivated_users_with_expiry AS
SELECT 
    'farmer' as user_type,
    farmer_id as user_id,
    full_name as name,
    email,
    deactivated_at,
    deactivated_by,
    (deactivated_at + INTERVAL '3 days') as expires_at,
    CASE 
        WHEN (deactivated_at + INTERVAL '3 days') <= NOW() THEN 'expired'
        WHEN (deactivated_at + INTERVAL '3 days') <= NOW() + INTERVAL '1 day' THEN 'expiring_soon'
        ELSE 'active_grace_period'
    END as status
FROM farmers 
WHERE is_active = false AND deactivated_at IS NOT NULL

UNION ALL

SELECT 
    'buyer' as user_type,
    buyer_id as user_id,
    owner_name as name,
    email,
    deactivated_at,
    deactivated_by,
    (deactivated_at + INTERVAL '3 days') as expires_at,
    CASE 
        WHEN (deactivated_at + INTERVAL '3 days') <= NOW() THEN 'expired'
        WHEN (deactivated_at + INTERVAL '3 days') <= NOW() + INTERVAL '1 day' THEN 'expiring_soon'
        ELSE 'active_grace_period'
    END as status
FROM buyers 
WHERE is_active = false AND deactivated_at IS NOT NULL

UNION ALL

SELECT 
    'association_officer' as user_type,
    officer_id as user_id,
    full_name as name,
    email,
    deactivated_at,
    deactivated_by,
    (deactivated_at + INTERVAL '3 days') as expires_at,
    CASE 
        WHEN (deactivated_at + INTERVAL '3 days') <= NOW() THEN 'expired'
        WHEN (deactivated_at + INTERVAL '3 days') <= NOW() + INTERVAL '1 day' THEN 'expiring_soon'
        ELSE 'active_grace_period'
    END as status
FROM association_officers 
WHERE is_active = false AND deactivated_at IS NOT NULL

ORDER BY deactivated_at DESC;

-- Add comment to the view
COMMENT ON VIEW deactivated_users_with_expiry IS 'View showing all deactivated users across all tables with their expiry status and remaining time before permanent deletion.';

-- Migration completed successfully
SELECT 'Deactivation fields migration completed successfully' as status;
