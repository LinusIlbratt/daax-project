-- Extensible agreement verification (checkbox now, eID signature later).

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS agreement_verification_method TEXT NOT NULL DEFAULT 'terms_acceptance',
  ADD COLUMN IF NOT EXISTS agreement_verification_ref TEXT;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_agreement_verification_method_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_agreement_verification_method_check
  CHECK (agreement_verification_method IN ('terms_acceptance', 'eid_signature'));

COMMENT ON COLUMN public.bookings.agreement_verification_method IS
  'terms_acceptance (checkbox) or eid_signature (BankID/Scrive etc.).';
COMMENT ON COLUMN public.bookings.agreement_verification_ref IS
  'Provider reference when method is eid_signature; null for terms_acceptance.';
