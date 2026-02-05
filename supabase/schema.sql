-- Products table for web app (kundapp + admin API)
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_day INTEGER NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('entreprenad', 'event')),
  image TEXT DEFAULT '',
  agreement TEXT NOT NULL,
  info TEXT,
  requires_delivery BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: allow read for anon (API uses service_role for read/write)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow service role all" ON products
  FOR ALL USING (auth.role() = 'service_role');

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
