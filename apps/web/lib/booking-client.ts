import type { AgreementVerification, CreateBookingPayload } from "@booking-system/types";

export type InitBookingCheckoutPayload = Omit<
  CreateBookingPayload,
  "verification"
> & {
  verification: AgreementVerification;
};

export async function initBookingCheckout(
  payload: InitBookingCheckoutPayload
): Promise<string> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    clientSecret?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Kunde inte starta betalningen.");
  }
  if (!data.clientSecret) {
    throw new Error("Betalningssession saknas. Försök igen.");
  }
  return data.clientSecret;
}
