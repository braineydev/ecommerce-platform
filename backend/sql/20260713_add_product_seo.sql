-- Product SEO is editable in the admin dashboard and served through the public API.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description text;

UPDATE public.products
SET slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Keep existing duplicate product names indexable by making their generated URLs unique.
WITH duplicate_slugs AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY id) AS position
  FROM public.products
  WHERE slug IS NOT NULL AND slug <> ''
)
UPDATE public.products AS product
SET slug = product.slug || '-' || left(product.id::text, 8)
FROM duplicate_slugs
WHERE product.id = duplicate_slugs.id AND duplicate_slugs.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_idx
  ON public.products (slug)
  WHERE slug IS NOT NULL AND slug <> '';
