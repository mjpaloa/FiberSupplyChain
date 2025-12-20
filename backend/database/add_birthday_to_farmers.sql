-- Migration: Add birthday field to farmers table
-- Date: 2024-12-20

-- Add birthday column to farmers table
ALTER TABLE public.farmers
ADD COLUMN IF NOT EXISTS birthday DATE NULL;

-- Add comment to the column
COMMENT ON COLUMN public.farmers.birthday IS 'Farmer date of birth';

-- Create index for birthday queries if needed
CREATE INDEX IF NOT EXISTS idx_farmers_birthday ON public.farmers USING btree (birthday);

-- Update trigger to handle birthday updates (already exists, just ensuring it covers new column)
-- The existing update_farmers_updated_at trigger will automatically handle the birthday field
