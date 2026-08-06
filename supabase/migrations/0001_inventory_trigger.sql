-- 1. Enable Realtime Replication on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- 2. Trigger Function: Sync is_available with stock_count
CREATE OR REPLACE FUNCTION check_stock_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_count <= 0 THEN
    NEW.is_available = FALSE;
  ELSE
    NEW.is_available = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger to store_inventory
DROP TRIGGER IF EXISTS trigger_check_stock ON public.store_inventory;
CREATE TRIGGER trigger_check_stock
BEFORE INSERT OR UPDATE OF stock_count ON public.store_inventory
FOR EACH ROW
EXECUTE FUNCTION check_stock_availability();
