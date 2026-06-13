-- Track when bookings were created (for expiring abandoned checkout sessions).

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.bookings
SET created_at = NOW()
WHERE created_at IS NULL;

ALTER TABLE public.bookings
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS bookings_pending_expiry_idx
  ON public.bookings (created_at)
  WHERE status = 'pending' AND payment_status = 'pending';

COMMENT ON COLUMN public.bookings.created_at IS
  'When the booking row was created; used to expire unpaid checkout sessions';
