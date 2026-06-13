import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { sendReceivedEmailForBooking } from "@/lib/booking-emails";
import type { CreatedBookingResult } from "@/lib/bookings";

const BOOKING_BY_PI_SELECT =
  "id, customer_name, customer_email, product_id, start_date, end_date, total_price, payment_status, booking_received_email_sent_at, products(name)" as const;

type BookingWebhookRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  product_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  payment_status: string;
  booking_received_email_sent_at: string | null;
  products: { name: string } | { name: string }[] | null;
};

function parseWebhookRow(value: unknown): BookingWebhookRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  if (typeof row.customer_name !== "string") return null;
  if (typeof row.customer_email !== "string") return null;
  if (typeof row.product_id !== "string") return null;
  if (typeof row.start_date !== "string") return null;
  if (typeof row.end_date !== "string") return null;
  if (typeof row.total_price !== "number") return null;
  if (typeof row.payment_status !== "string") return null;

  let products: BookingWebhookRow["products"] = null;
  const p = row.products;
  if (Array.isArray(p) && p[0] && typeof p[0] === "object") {
    const prod = p[0] as Record<string, unknown>;
    if (typeof prod.name === "string") products = { name: prod.name };
  } else if (p && typeof p === "object") {
    const prod = p as Record<string, unknown>;
    if (typeof prod.name === "string") products = { name: prod.name };
  }

  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    product_id: row.product_id,
    start_date: row.start_date,
    end_date: row.end_date,
    total_price: row.total_price,
    payment_status: row.payment_status,
    booking_received_email_sent_at:
      typeof row.booking_received_email_sent_at === "string"
        ? row.booking_received_email_sent_at
        : null,
    products,
  };
}

function productNameFromRow(row: BookingWebhookRow): string {
  const p = row.products;
  if (Array.isArray(p) && p[0]?.name) return p[0].name;
  if (p && !Array.isArray(p) && p.name) return p.name;
  return row.product_id;
}

function toCreatedBookingResult(row: BookingWebhookRow): CreatedBookingResult {
  return {
    id: row.id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    productName: productNameFromRow(row),
    productId: row.product_id,
    startDate: row.start_date,
    endDate: row.end_date,
    totalPrice: row.total_price,
    requiresDelivery: false,
  };
}

export async function handlePaymentIntentAmountCapturableUpdated(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const piId = paymentIntent.id;
  const bookingIdFromMeta =
    typeof paymentIntent.metadata?.booking_id === "string"
      ? paymentIntent.metadata.booking_id
      : null;

  let query = supabase.from("bookings").select(BOOKING_BY_PI_SELECT);

  if (bookingIdFromMeta) {
    query = query.eq("id", bookingIdFromMeta);
  } else {
    query = query.eq("stripe_payment_intent_id", piId);
  }

  const { data: existing, error: fetchError } = await query.maybeSingle();

  if (fetchError) {
    console.error(
      "stripe-webhook:amount_capturable fetch",
      fetchError.message,
      fetchError
    );
    throw fetchError;
  }

  const row = parseWebhookRow(existing);
  if (!row) {
    console.warn("stripe-webhook:amount_capturable booking not found", piId);
    return;
  }

  if (row.payment_status === "requires_capture") {
    if (!row.booking_received_email_sent_at) {
      await sendReceivedEmailForBooking(
        supabase,
        toCreatedBookingResult(row)
      );
    }
    return;
  }

  if (
    row.payment_status === "succeeded" ||
    row.payment_status === "canceled" ||
    row.payment_status === "refunded"
  ) {
    return;
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ payment_status: "requires_capture" })
    .eq("id", row.id)
    .eq("payment_status", "pending");

  if (updateError) {
    console.error(
      "stripe-webhook:amount_capturable update",
      updateError.message,
      updateError
    );
    throw updateError;
  }

  await sendReceivedEmailForBooking(supabase, toCreatedBookingResult(row));
}

export async function handlePaymentIntentPaymentFailed(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const piId = paymentIntent.id;

  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: "canceled" })
    .eq("stripe_payment_intent_id", piId)
    .in("payment_status", ["pending", "requires_capture"]);

  if (error) {
    console.error(
      "stripe-webhook:payment_failed update",
      error.message,
      error
    );
    throw error;
  }
}
