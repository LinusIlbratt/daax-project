import type { SupabaseClient } from "@supabase/supabase-js";
import {
  formatBookingPeriod,
  sendBookingConfirmedEmail,
} from "@booking-system/emails";
import { getStripeServer } from "@/lib/stripe";

const DEFAULT_DELIVERY_TIME = "09:00–12:00";

const BOOKING_CONFIRM_SELECT =
  "id, status, payment_status, stripe_payment_intent_id, customer_name, customer_email, customer_phone, start_date, end_date, total_price, delivery_address, product_id, products(name, requires_delivery)" as const;

type BookingConfirmRow = {
  id: string;
  status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  customer_name: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  total_price: number;
  delivery_address: string | null;
  product_id: string;
  products: { name: string; requires_delivery: boolean } | null;
};

function parseConfirmRow(value: unknown): BookingConfirmRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  if (row.status !== "pending" && row.status !== "confirmed") return null;
  if (typeof row.payment_status !== "string") return null;
  if (
    row.stripe_payment_intent_id !== null &&
    typeof row.stripe_payment_intent_id !== "string"
  ) {
    return null;
  }
  if (typeof row.customer_name !== "string") return null;
  if (typeof row.customer_email !== "string") return null;
  if (typeof row.start_date !== "string") return null;
  if (typeof row.end_date !== "string") return null;
  if (typeof row.total_price !== "number") return null;
  if (typeof row.product_id !== "string") return null;

  let products: BookingConfirmRow["products"] = null;
  const p = row.products;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const prod = p as Record<string, unknown>;
    if (typeof prod.name === "string") {
      products = {
        name: prod.name,
        requires_delivery: Boolean(prod.requires_delivery),
      };
    }
  }

  return {
    id: row.id,
    status: row.status,
    payment_status: row.payment_status,
    stripe_payment_intent_id:
      typeof row.stripe_payment_intent_id === "string"
        ? row.stripe_payment_intent_id
        : null,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    start_date: row.start_date,
    end_date: row.end_date,
    total_price: row.total_price,
    delivery_address:
      typeof row.delivery_address === "string"
        ? row.delivery_address.trim() || null
        : null,
    product_id: row.product_id,
    products,
  };
}

export type ConfirmBookingResult =
  | {
      ok: true;
      bookingId: string;
      emailSent: boolean;
      emailSkippedReason?: string;
      emailError?: string;
    }
  | { ok: false; status: number; error: string };

/**
 * Captures reserved Stripe payment, confirms booking, sends confirmation email.
 */
export async function confirmBookingWithEmail(
  client: SupabaseClient,
  bookingId: string
): Promise<ConfirmBookingResult> {
  const stripe = getStripeServer();
  if (!stripe) {
    console.error("confirm-booking: missing STRIPE_SECRET_KEY");
    return { ok: false, status: 503, error: "Stripe is not configured" };
  }

  const { data: existing, error: fetchError } = await client
    .from("bookings")
    .select(BOOKING_CONFIRM_SELECT)
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    console.error("confirm-booking: fetch", fetchError.message, fetchError);
    return { ok: false, status: 500, error: fetchError.message };
  }

  const row = parseConfirmRow(existing);
  if (!row) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  if (row.status === "confirmed") {
    return { ok: false, status: 409, error: "Booking is already confirmed" };
  }

  if (row.status !== "pending") {
    return { ok: false, status: 400, error: "Booking cannot be confirmed" };
  }

  if (row.payment_status !== "requires_capture") {
    return {
      ok: false,
      status: 400,
      error:
        "Payment must be authorized before the booking can be confirmed. Current status: " +
        row.payment_status,
    };
  }

  if (!row.stripe_payment_intent_id) {
    return {
      ok: false,
      status: 400,
      error: "Booking has no payment to capture",
    };
  }

  try {
    await stripe.paymentIntents.capture(row.stripe_payment_intent_id);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to capture payment";
    console.error("confirm-booking:stripe capture", message, e);
    return { ok: false, status: 502, error: message };
  }

  const { error: updateError } = await client
    .from("bookings")
    .update({ status: "confirmed", payment_status: "succeeded" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .eq("payment_status", "requires_capture");

  if (updateError) {
    console.error("confirm-booking: update", updateError.message, updateError);
    return { ok: false, status: 500, error: updateError.message };
  }

  const productName = row.products?.name ?? row.product_id;
  const requiresDelivery = row.products?.requires_delivery ?? false;

  const emailResult = await sendBookingConfirmedEmail(row.customer_email, {
    customerName: row.customer_name,
    productName,
    periodLabel: formatBookingPeriod(row.start_date, row.end_date),
    totalPrice: row.total_price,
    deliveryAddress: row.delivery_address,
    requiresDelivery,
    deliveryTimeWindow: DEFAULT_DELIVERY_TIME,
  });

  let emailSent = false;
  let emailSkippedReason: string | undefined;
  let emailError: string | undefined;

  if (emailResult.ok) {
    emailSent = true;
    const sentAt = new Date().toISOString();
    const { error: markError } = await client
      .from("bookings")
      .update({ confirmation_email_sent_at: sentAt })
      .eq("id", bookingId);

    if (markError) {
      console.error(
        "confirm-booking: confirmation_email_sent_at",
        markError.message,
        markError
      );
    }
  } else if (emailResult.skipped) {
    emailSkippedReason = emailResult.reason;
    console.warn("confirm-booking: email skipped", emailResult.reason);
  } else {
    emailError = emailResult.error;
    console.error("confirm-booking: email failed", emailResult.error);
  }

  return {
    ok: true,
    bookingId,
    emailSent,
    emailSkippedReason,
    emailError,
  };
}
