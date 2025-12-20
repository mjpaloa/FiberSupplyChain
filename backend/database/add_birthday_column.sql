-- Add birthday column to farmers table
-- Run this in Supabase SQL Editor

ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS birthday DATE;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'farmers' AND column_name = 'birthday';
