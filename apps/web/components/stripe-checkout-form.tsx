"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CheckoutPaymentForm({
  returnUrl,
  onSuccess,
  onError,
}: {
  returnUrl: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError("Betalningssystemet är inte redo. Försök igen.");
      return;
    }

    setPaying(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Betalningen misslyckades.");
        return;
      }

      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Betalningen misslyckades.";
      onError(message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || paying}
        className="theme-btn-primary w-full py-3.5"
      >
        {paying ? "Bearbetar betalning…" : "Betala och reservera belopp"}
      </button>
      <p className="text-center text-xs text-brand-text-subtle">
        Beloppet reserveras på ditt kort. Debitering sker när vi godkänt din
        bokning.
      </p>
    </form>
  );
}

export function StripeCheckoutSection({
  clientSecret,
  returnUrl,
  onSuccess,
  onError,
  onBack,
}: {
  clientSecret: string;
  returnUrl: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onBack: () => void;
}) {
  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#0f172a",
          borderRadius: "10px",
          colorText: "#0f172a",
          fontFamily: "Inter, system-ui, sans-serif",
        },
      },
    }),
    [clientSecret]
  );

  if (!stripePromise) {
    return (
      <p className="text-sm text-red-700" role="alert">
        Stripe är inte konfigurerat (saknar publik nyckel).
      </p>
    );
  }

  return (
    <div className="mt-6 border-t border-brand-border pt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-brand-text">Betalning</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-brand-text-muted hover:text-brand-text"
        >
          ← Tillbaka
        </button>
      </div>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutPaymentForm
          returnUrl={returnUrl}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
}
