-- Stripe Auth & Capture: PaymentIntent reference and payment lifecycle on bookings.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (
    payment_status IN (
      'pending',
      'requires_capture',
      'succeeded',
      'canceled',
      'refunded'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS bookings_stripe_payment_intent_id_key
  ON public.bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

COMMENT ON COLUMN public.bookings.stripe_payment_intent_id IS
  'Stripe PaymentIntent id (manual capture).';
COMMENT ON COLUMN public.bookings.payment_status IS
  'pending → requires_capture (authorized) → succeeded (captured) | canceled | refunded';
