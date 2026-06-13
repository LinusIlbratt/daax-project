-- Legal traceability: when and which agreement text the customer accepted

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_agreement_snapshot TEXT;

COMMENT ON COLUMN bookings.terms_accepted_at IS 'Timestamp when customer accepted rental terms at checkout';
COMMENT ON COLUMN bookings.accepted_agreement_snapshot IS 'Full agreement text shown to customer at acceptance (immutable snapshot)';
