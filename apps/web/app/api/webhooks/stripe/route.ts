import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  handlePaymentIntentAmountCapturableUpdated,
  handlePaymentIntentPaymentFailed,
} from "@/lib/stripe-webhook-handlers";
import { getStripeServer, getStripeWebhookSecret } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const webhookSecret = getStripeWebhookSecret();
  const supabase = getSupabase();

  if (!stripe || !webhookSecret || !supabase) {
    console.error(
      "webhooks/stripe: missing STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, or Supabase"
    );
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature";
    console.error("webhooks/stripe: constructEvent", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.amount_capturable_updated": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentAmountCapturableUpdated(
          supabase,
          paymentIntent
        );
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentPaymentFailed(supabase, paymentIntent);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("webhooks/stripe: handler", event.type, e);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
