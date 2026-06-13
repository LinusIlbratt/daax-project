import {
  BOOKING_STATUS_BADGE,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  type BookingListRow,
} from "@/lib/supabase/bookings";
import type { BookingPaymentStatus, BookingStatus } from "@booking-system/types";

export function PaymentStatusBadge({
  paymentStatus,
}: {
  paymentStatus: BookingPaymentStatus;
}) {
  return (
    <span
      className={`admin-badge ${PAYMENT_STATUS_BADGE[paymentStatus]}`}
      title={`Betalningsstatus: ${PAYMENT_STATUS_LABELS[paymentStatus]}`}
    >
      {PAYMENT_STATUS_LABELS[paymentStatus]}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`admin-badge ${BOOKING_STATUS_BADGE[status]}`}>
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

/** Bokningsstatus + betalningsstatus sida vid sida. */
export function BookingStatusBadges({
  status,
  payment_status,
}: Pick<BookingListRow, "status" | "payment_status">) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <BookingStatusBadge status={status} />
      <PaymentStatusBadge paymentStatus={payment_status} />
    </span>
  );
}
