-- Bookings: customer rentals linked to products (slug = product_id)
-- Blocked dates: days unavailable for booking (replaces JSON file store)

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products (slug) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed')),
  CONSTRAINT bookings_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS bookings_product_id_idx ON bookings (product_id);
CREATE INDEX IF NOT EXISTS bookings_start_date_idx ON bookings (start_date);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_authenticated"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bookings_insert_authenticated"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "bookings_update_authenticated"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "bookings_delete_authenticated"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- Bookings are not exposed to anon (use authenticated admin or a dedicated API with service role later).

CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "date" DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT ''
);

CREATE UNIQUE INDEX IF NOT EXISTS blocked_dates_date_key ON blocked_dates ("date");

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_dates_select_authenticated"
  ON blocked_dates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "blocked_dates_insert_authenticated"
  ON blocked_dates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "blocked_dates_update_authenticated"
  ON blocked_dates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "blocked_dates_delete_authenticated"
  ON blocked_dates FOR DELETE
  TO authenticated
  USING (true);

-- Customer booking flow can read blocked dates without auth (aligns with previous public GET)
CREATE POLICY "blocked_dates_select_anon"
  ON blocked_dates FOR SELECT
  TO anon
  USING (true);
