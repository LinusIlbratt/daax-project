-- Track when transactional booking emails were sent via Resend

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_received_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.booking_received_email_sent_at IS 'When BookingReceivedEmail was sent to customer';
COMMENT ON COLUMN bookings.confirmation_email_sent_at IS 'When BookingConfirmedEmail was sent after admin approval';
