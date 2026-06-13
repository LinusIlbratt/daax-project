import type { AgreementVerificationMethod } from "@booking-system/types";

/**
 * Active agreement verification for web checkout.
 * Switch to `eid_signature` when Scrive/BankID is integrated.
 */
export const ACTIVE_AGREEMENT_VERIFICATION_METHOD: AgreementVerificationMethod =
  "terms_acceptance";

export const BOOKING_STEPS = [
  "dates",
  "details",
  "agreement",
  "payment",
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

export const BOOKING_STEP_LABELS: Record<BookingStep, string> = {
  dates: "Datum",
  details: "Uppgifter",
  agreement: "Avtal",
  payment: "Betalning",
};
