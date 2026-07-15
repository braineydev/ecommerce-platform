ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS initial_price NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_name TEXT;

UPDATE public.products
SET initial_price = COALESCE(initial_price, price),
    discounted_price = COALESCE(discounted_price, price)
WHERE initial_price IS NULL OR discounted_price IS NULL;
