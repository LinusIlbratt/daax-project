-- Public bucket for product photos (URL stored in products.image)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Anyone can read (kundwebben visar publika URL:er)
DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;
CREATE POLICY "product_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Inloggade admin-användare kan ladda upp / byta / ta bort
DROP POLICY IF EXISTS "product_images_insert_authenticated" ON storage.objects;
CREATE POLICY "product_images_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_update_authenticated" ON storage.objects;
CREATE POLICY "product_images_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_delete_authenticated" ON storage.objects;
CREATE POLICY "product_images_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
