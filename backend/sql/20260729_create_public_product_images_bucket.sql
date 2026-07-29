-- Product records retain a permanent public Storage URL. The bucket therefore
-- must allow anonymous reads; uploads continue to go through server-only admin
-- endpoints using the service-role key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public URLs use the storage.objects SELECT policy. Repeating this migration
-- is safe because the policy is recreated with its intended definition.
DROP POLICY IF EXISTS "Public product images are readable" ON storage.objects;
CREATE POLICY "Public product images are readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
