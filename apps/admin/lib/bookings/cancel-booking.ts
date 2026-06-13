import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingPaymentStatus } from "@booking-system/types";
import { getStripeServer } from "@/lib/stripe";

const BOOKING_CANCEL_SELECT =
  "id, status, payment_status, stripe_payment_intent_id" as const;

type BookingCancelRow = {
  id: string;
  status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
};

function parseCancelRow(value: unknown): BookingCancelRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  if (
    row.status !== "pending" &&
    row.status !== "confirmed" &&
    row.status !== "canceled"
  ) {
    return null;
  }
  if (typeof row.payment_status !== "string") return null;
  if (
    row.stripe_payment_intent_id !== null &&
    typeof row.stripe_payment_intent_id !== "string"
  ) {
    return null;
  }
  return {
    id: row.id,
    status: row.status,
    payment_status: row.payment_status,
    stripe_payment_intent_id:
      typeof row.stripe_payment_intent_id === "string"
        ? row.stripe_payment_intent_id
        : null,
  };
}

export type CancelBookingResult =
  | {
      ok: true;
      bookingId: string;
      paymentStatus: BookingPaymentStatus | null;
    }
  | { ok: false; status: number; error: string };

/**
 * Cancels or denies a booking and syncs Stripe (release auth or refund).
 */
export async function cancelBookingWithStripe(
  client: SupabaseClient,
  bookingId: string
): Promise<CancelBookingResult> {
  const stripe = getStripeServer();
  if (!stripe) {
    console.error("cancel-booking: missing STRIPE_SECRET_KEY");
    return { ok: false, status: 503, error: "Stripe is not configured" };
  }

  const { data: existing, error: fetchError } = await client
    .from("bookings")
    .select(BOOKING_CANCEL_SELECT)
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    console.error("cancel-booking: fetch", fetchError.message, fetchError);
    return { ok: false, status: 500, error: fetchError.message };
  }

  const row = parseCancelRow(existing);
  if (!row) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  if (row.status === "canceled") {
    return { ok: false, status: 409, error: "Booking is already canceled" };
  }

  if (row.payment_status === "refunded") {
    return {
      ok: false,
      status: 409,
      error: "Payment has already been refunded",
    };
  }

  let nextPaymentStatus: BookingPaymentStatus | null = null;
  const intentId = row.stripe_payment_intent_id;

  try {
    if (row.payment_status === "requires_capture" && intentId) {
      await stripe.paymentIntents.cancel(intentId);
      nextPaymentStatus = "canceled";
    } else if (row.payment_status === "succeeded" && intentId) {
      await stripe.refunds.create({ payment_intent: intentId });
      nextPaymentStatus = "refunded";
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to update payment in Stripe";
    console.error("cancel-booking:stripe", message, e);
    return { ok: false, status: 502, error: message };
  }

  const updatePayload: {
    status: "canceled";
    payment_status?: BookingPaymentStatus;
  } = { status: "canceled" };

  if (nextPaymentStatus) {
    updatePayload.payment_status = nextPaymentStatus;
  }

  const { error: updateError } = await client
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .in("status", ["pending", "confirmed"]);

  if (updateError) {
    console.error("cancel-booking: update", updateError.message, updateError);
    return { ok: false, status: 500, error: updateError.message };
  }

  return {
    ok: true,
    bookingId,
    paymentStatus: nextPaymentStatus,
  };
}
