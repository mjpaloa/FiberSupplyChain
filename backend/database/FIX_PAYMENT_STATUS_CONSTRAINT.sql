-- FIX: Update fiber_deliveries payment_status constraint
-- Run this in Supabase SQL Editor

-- Step 1: Update any existing NULL values to 'Unpaid'
UPDATE fiber_deliveries 
SET payment_status = 'Unpaid' 
WHERE payment_status IS NULL;

-- Step 2: Update any 'Pending' values to 'Unpaid'
UPDATE fiber_deliveries 
SET payment_status = 'Unpaid' 
WHERE payment_status = 'Pending';

-- Step 3: Drop the old constraint
ALTER TABLE fiber_deliveries 
DROP CONSTRAINT IF EXISTS fiber_deliveries_payment_status_check;

-- Step 4: Add the correct constraint
ALTER TABLE fiber_deliveries 
ADD CONSTRAINT fiber_deliveries_payment_status_check 
CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid'));

-- Step 5: Set default value
ALTER TABLE fiber_deliveries 
ALTER COLUMN payment_status SET DEFAULT 'Unpaid';

-- Step 6: Make column NOT NULL
ALTER TABLE fiber_deliveries 
ALTER COLUMN payment_status SET NOT NULL;

-- Verify
SELECT DISTINCT payment_status FROM fiber_deliveries;
