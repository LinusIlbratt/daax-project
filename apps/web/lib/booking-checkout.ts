import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreatedBookingResult } from "@/lib/bookings";
import { getStripeServer } from "@/lib/stripe";

export type BookingCheckoutInitResult = {
  clientSecret: string;
  bookingId: string;
};

export async function initBookingStripeCheckout(
  supabase: SupabaseClient,
  booking: CreatedBookingResult
): Promise<BookingCheckoutInitResult> {
  const stripe = getStripeServer();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const amountOre = Math.round(booking.totalPrice * 100);
  if (amountOre < 300) {
    throw new Error("Booking total is below minimum charge amount");
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountOre,
      currency: "sek",
      capture_method: "manual",
      receipt_email: booking.customerEmail,
      metadata: {
        booking_id: booking.id,
        product_id: booking.productId,
      },
    });
  } catch (e) {
    console.error("booking-checkout:create PaymentIntent", e);
    const { error: cancelError } = await supabase
      .from("bookings")
      .update({ payment_status: "canceled" })
      .eq("id", booking.id)
      .eq("payment_status", "pending");

    if (cancelError) {
      console.error(
        "booking-checkout:cancel booking after PI failure",
        cancelError.message,
        cancelError
      );
    }
    throw new Error("Failed to initialize payment");
  }

  const clientSecret = paymentIntent.client_secret;
  if (!clientSecret) {
    console.error("booking-checkout:missing client_secret", paymentIntent.id);
    throw new Error("Failed to initialize payment");
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq("id", booking.id)
    .eq("payment_status", "pending");

  if (updateError) {
    console.error(
      "booking-checkout:save payment intent id",
      updateError.message,
      updateError
    );
    try {
      await stripe.paymentIntents.cancel(paymentIntent.id);
    } catch (cancelPiError) {
      console.error("booking-checkout:cancel PaymentIntent", cancelPiError);
    }
    throw new Error("Failed to initialize payment");
  }

  return {
    clientSecret,
    bookingId: booking.id,
  };
}
