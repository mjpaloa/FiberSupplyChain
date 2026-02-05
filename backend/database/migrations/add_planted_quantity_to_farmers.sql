-- Migration: Add planted_quantity and damaged_quantity to farmer_seedling_distributions
-- Allows farmers to specify exactly how many seedlings were planted vs damaged

-- Step 1: Add columns to farmer_seedling_distributions
ALTER TABLE public.farmer_seedling_distributions 
ADD COLUMN IF NOT EXISTS planted_quantity INTEGER,
ADD COLUMN IF NOT EXISTS damaged_quantity INTEGER;

-- Step 2: Initialize planted_quantity for existing planted records
-- For existing 'planted' records, assume all distributed were planted
UPDATE public.farmer_seedling_distributions
SET planted_quantity = quantity_distributed
WHERE status = 'planted' AND planted_quantity IS NULL;

-- Step 3: Update the association distribution status trigger to use planted_quantity
CREATE OR REPLACE FUNCTION update_association_distribution_status()
RETURNS TRIGGER AS $$
DECLARE
  total_distributed INTEGER;
  total_planted INTEGER;
  assoc_quantity INTEGER;
  new_status VARCHAR;
BEGIN
  -- Get the association distribution quantity
  SELECT quantity_distributed INTO assoc_quantity
  FROM association_seedling_distributions
  WHERE distribution_id = COALESCE(NEW.association_distribution_id, OLD.association_distribution_id);

  -- Calculate total distributed to farmers
  SELECT COALESCE(SUM(quantity_distributed), 0) INTO total_distributed
  FROM farmer_seedling_distributions
  WHERE association_distribution_id = COALESCE(NEW.association_distribution_id, OLD.association_distribution_id);

  -- Calculate total planted by farmers (using the new planted_quantity field)
  -- Fallback to quantity_distributed if planted_quantity is null for older records
  SELECT COALESCE(SUM(COALESCE(planted_quantity, quantity_distributed)), 0) INTO total_planted
  FROM farmer_seedling_distributions
  WHERE association_distribution_id = COALESCE(NEW.association_distribution_id, OLD.association_distribution_id)
    AND status = 'planted';

  -- Determine new status based on distribution and planting progress
  IF total_distributed = 0 THEN
    new_status := 'distributed_to_association';
  ELSIF total_distributed >= assoc_quantity THEN
    IF total_planted >= assoc_quantity THEN
      new_status := 'fully_planted';
    ELSIF total_planted > 0 THEN
      new_status := 'partially_planted';
    ELSE
      new_status := 'fully_distributed_to_farmers';
    END IF;
  ELSE
    IF total_planted > 0 THEN
      new_status := 'partially_planted';
    ELSE
      new_status := 'partially_distributed_to_farmers';
    END IF;
  END IF;

  -- Update the association distribution
  UPDATE association_seedling_distributions
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE distribution_id = COALESCE(NEW.association_distribution_id, OLD.association_distribution_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
