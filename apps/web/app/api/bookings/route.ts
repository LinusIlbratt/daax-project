import { NextResponse } from "next/server";
import { initBookingStripeCheckout } from "@/lib/booking-checkout";
import { createBooking, validateCreateBookingInput } from "@/lib/bookings";
import { checkBookingCreateRateLimit } from "@/lib/rate-limit";
import { getStripeServer } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const rate = checkBookingCreateRateLimit(request);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  const supabase = getSupabase();

  if (!supabase) {
    console.error(
      "bookings:POST missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return NextResponse.json(
      { error: "Bookings are not configured" },
      { status: 503 }
    );
  }

  if (!getStripeServer()) {
    console.error("bookings:POST missing STRIPE_SECRET_KEY");
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    console.error("bookings:POST parse body", e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateCreateBookingInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const created = await createBooking(supabase, validated.data);
    const checkout = await initBookingStripeCheckout(supabase, created);

    return NextResponse.json(
      {
        ok: true,
        id: checkout.bookingId,
        clientSecret: checkout.clientSecret,
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create booking";
    console.error("bookings:POST", message, e);

    if (
      message === "Product not found or not available" ||
      message === "Selected dates include blocked days" ||
      message === "Selected dates are no longer available for this product" ||
      message === "deliveryAddress is required for this product" ||
      message ===
        "Agreement text has changed. Please reload the page and accept the terms again." ||
      message === "Booking total is below minimum charge amount" ||
      message.startsWith('Verification method "') ||
      message === "eID signature verification is not configured"
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message === "Stripe is not configured" || message === "Failed to initialize payment") {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
