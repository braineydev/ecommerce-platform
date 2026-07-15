ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;
CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products (brand);
