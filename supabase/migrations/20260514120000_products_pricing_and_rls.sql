-- Extra pricing, visibility, creator tracking + RLS for admin (authenticated JWT)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_per_week integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN products.price_per_week IS 'Price in SEK per week';
COMMENT ON COLUMN products.price_per_month IS 'Price in SEK per month';
COMMENT ON COLUMN products.is_active IS 'When false, product is hidden from customer flows that respect this flag';
COMMENT ON COLUMN products.created_by IS 'Auth user who created the row (admin UI)';

-- Authenticated admins: manage catalog (browser client uses anon key + user JWT → role authenticated)
DROP POLICY IF EXISTS "products_authenticated_insert" ON products;
CREATE POLICY "products_authenticated_insert" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "products_authenticated_update" ON products;
CREATE POLICY "products_authenticated_update" ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "products_authenticated_delete" ON products;
CREATE POLICY "products_authenticated_delete" ON products
  FOR DELETE
  TO authenticated
  USING (true);
