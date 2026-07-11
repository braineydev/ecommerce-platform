-- Decrement stock atomically for a list of items
-- items: jsonb array of objects with keys: id, quantity
CREATE OR REPLACE FUNCTION public.decrement_stock(items jsonb)
RETURNS void AS $$
DECLARE
  itm jsonb;
  pid text;
  qty int;
  updated int;
BEGIN
  -- Acquire an advisory transaction lock to reduce race windows
  PERFORM pg_advisory_xact_lock(1);

  FOR itm IN SELECT * FROM jsonb_array_elements(items) LOOP
    pid := itm->> 'id';
    qty := (itm->> 'quantity')::int;

    -- Attempt to decrement only if sufficient stock exists
    UPDATE products
    SET stock = stock - qty
    WHERE id::text = pid
      AND stock >= qty;

    GET DIAGNOSTICS updated = ROW_COUNT;
    IF updated = 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product % (requested %)', pid, qty;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
