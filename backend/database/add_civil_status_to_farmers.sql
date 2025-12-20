-- Add civil_status column to farmers table
-- Run this in Supabase SQL Editor

ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS civil_status VARCHAR(20);

-- Add check constraint for valid values
ALTER TABLE public.farmers ADD CONSTRAINT farmers_civil_status_check 
CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Divorced', 'Separated'));

-- Add comment
COMMENT ON COLUMN public.farmers.civil_status IS 'Civil/Marital status of the farmer';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farmers' AND column_name = 'civil_status';
