-- Remove integer limit on quantity_distributed fields
-- Change from integer (max 2,147,483,647) to bigint (max 9,223,372,036,854,775,807)

-- STEP 1: Drop triggers that depend on quantity_distributed column
DROP TRIGGER IF EXISTS trigger_update_assoc_status_on_insert ON farmer_seedling_distributions;
DROP TRIGGER IF EXISTS trigger_update_assoc_status_on_update ON farmer_seedling_distributions;
DROP TRIGGER IF EXISTS trigger_update_assoc_status_on_delete ON farmer_seedling_distributions;

-- STEP 2: Update column types to bigint
ALTER TABLE public.association_seedling_distributions 
ALTER COLUMN quantity_distributed TYPE bigint;

ALTER TABLE public.farmer_seedling_distributions 
ALTER COLUMN quantity_distributed TYPE bigint;

-- STEP 3: Recreate the trigger function with bigint types
CREATE OR REPLACE FUNCTION update_association_distribution_status()
RETURNS TRIGGER AS $$
DECLARE
  total_distributed BIGINT;
  total_planted BIGINT;
  assoc_quantity BIGINT;
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

  -- Calculate total planted by farmers
  SELECT COALESCE(SUM(quantity_distributed), 0) INTO total_planted
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

-- STEP 4: Recreate the triggers
CREATE TRIGGER trigger_update_assoc_status_on_insert
AFTER INSERT ON farmer_seedling_distributions
FOR EACH ROW
EXECUTE FUNCTION update_association_distribution_status();

CREATE TRIGGER trigger_update_assoc_status_on_update
AFTER UPDATE ON farmer_seedling_distributions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.quantity_distributed IS DISTINCT FROM NEW.quantity_distributed)
EXECUTE FUNCTION update_association_distribution_status();

CREATE TRIGGER trigger_update_assoc_status_on_delete
AFTER DELETE ON farmer_seedling_distributions
FOR EACH ROW
EXECUTE FUNCTION update_association_distribution_status();

-- STEP 5: Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '✅ quantity_distributed columns updated to bigint';
  RAISE NOTICE '✅ Triggers recreated with bigint support';
  RAISE NOTICE '✅ No more limits on seedling quantities!';
END $$;
