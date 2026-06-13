-- Customer delivery and company fields on bookings (checkout + admin logistics)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS org_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_notes TEXT;

COMMENT ON COLUMN bookings.delivery_address IS 'Full delivery address when product requires delivery';
COMMENT ON COLUMN bookings.org_number IS 'Organisationsnummer or personnummer from checkout';
COMMENT ON COLUMN bookings.customer_notes IS 'Optional message from customer at checkout';
