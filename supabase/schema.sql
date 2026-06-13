-- Products table for web app (kundapp + admin API)
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_day INTEGER NOT NULL,
  price_per_week INTEGER NOT NULL DEFAULT 0,
  price_per_month INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('entreprenad', 'event')),
  image TEXT DEFAULT '',
  agreement TEXT NOT NULL,
  info TEXT,
  requires_delivery BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: allow read for anon (API uses service_role for read/write)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow service role all" ON products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "products_authenticated_insert" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "products_authenticated_update" ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "products_authenticated_delete" ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Optional: trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

-- Additional tables: apply via Supabase CLI migrations or run the SQL file:
-- supabase/migrations/20260329120000_bookings_and_blocked_dates.sql
-- supabase/migrations/20260530140000_bookings_customer_fields.sql
-- supabase/migrations/20260531120000_user_roles_rbac.sql
-- supabase/migrations/20260531140000_bookings_terms_acceptance.sql
-- supabase/migrations/20260531160000_bookings_email_sent_tracking.sql
-- supabase/migrations/20260531180000_bookings_stripe_payment.sql
-- supabase/migrations/20260601120000_bookings_status_canceled.sql
-- (bookings, blocked_dates, user_roles RBAC, terms snapshot, email tracking, Stripe payment)
