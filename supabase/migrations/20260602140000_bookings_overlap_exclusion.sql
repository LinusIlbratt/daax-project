-- Prevent overlapping active bookings for the same product (race-safe at DB level).

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_range daterange
  GENERATED ALWAYS AS (daterange(start_date, end_date, '[]')) STORED;

CREATE INDEX IF NOT EXISTS bookings_product_range_gist_idx
  ON public.bookings USING gist (product_id, booking_range);

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_active_overlap;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_active_overlap
  EXCLUDE USING gist (product_id WITH =, booking_range WITH &&)
  WHERE (
    status IN ('pending', 'confirmed')
    AND payment_status NOT IN ('canceled', 'refunded')
  );

COMMENT ON CONSTRAINT bookings_no_active_overlap ON public.bookings IS
  'One active booking per product per date range; canceled/refunded rows are ignored.';
