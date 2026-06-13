"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AgreementVerification } from "@booking-system/types";
import { BookingProductHeader, BookingBackLink } from "@/components/booking/booking-product-header";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { AgreementVerificationStep } from "@/components/booking/agreement-verification-step";
import { BookingStepIndicator } from "@/components/booking/booking-step-indicator";
import { BookingCalculator } from "@/components/booking-calculator";
import { StripeCheckoutSection } from "@/components/stripe-checkout-form";
import type { BookingStep } from "@/lib/booking-config";
import { BOOKING_STEPS } from "@/lib/booking-config";
import { initBookingCheckout } from "@/lib/booking-client";
import { calculateBookingTotal } from "@/lib/bookings";
import type { ProductData } from "@/lib/products-data";

type DateSelection = {
  startDate: string;
  endDate: string;
  canProceed: boolean;
  days: number;
  total: number;
};

const inputClassName =
  "w-full min-h-[44px] rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-base text-brand-text placeholder:text-brand-text-subtle focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-sm";

export function BookingWizard({
  product,
  agreementText,
}: {
  product: ProductData;
  agreementText: string;
}) {
  const searchParams = useSearchParams();
  const initialStart = searchParams.get("start") ?? "";
  const initialEnd = searchParams.get("end") ?? "";

  const [step, setStep] = useState<BookingStep>(() => {
    if (initialStart && initialEnd) return "details";
    return "dates";
  });
  const [dateSelection, setDateSelection] = useState<DateSelection | null>(() =>
    initialStart && initialEnd
      ? {
          startDate: initialStart,
          endDate: initialEnd,
          canProceed: true,
          days: calculateBookingTotal(
            product.pricePerDay,
            initialStart,
            initialEnd
          ).days,
          total: calculateBookingTotal(
            product.pricePerDay,
            initialStart,
            initialEnd
          ).totalPrice,
        }
      : null
  );
  const [customerName, setCustomerName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<{
    street: string;
    zip: string;
    city: string;
  } | null>(null);
  const [verification, setVerification] = useState<AgreementVerification | null>(
    null
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const requiresDelivery = Boolean(product.requiresDelivery);
  const stepIndex = BOOKING_STEPS.indexOf(step);

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status");
    const paymentReturn = searchParams.get("payment_return");
    if (paymentReturn === "1" && redirectStatus === "succeeded") {
      setPaid(true);
      setStep("payment");
    }
  }, [searchParams]);

  const stripeReturnUrl = useMemo(() => {
    if (typeof window === "undefined" || !dateSelection) return "";
    const params = new URLSearchParams({
      start: dateSelection.startDate,
      end: dateSelection.endDate,
      payment_return: "1",
    });
    return `${window.location.origin}/boka/${encodeURIComponent(product.slug)}?${params.toString()}`;
  }, [dateSelection, product.slug]);

  const summary = useMemo(() => {
    if (!dateSelection) return null;
    return {
      days: dateSelection.days,
      total: dateSelection.total,
      startDate: dateSelection.startDate,
      endDate: dateSelection.endDate,
    };
  }, [dateSelection]);

  const validateDetails = (): string | null => {
    if (customerName.trim().length < 2) return "Ange företagsnamn.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      return "Ange en giltig e-postadress.";
    }
    if (phoneValue.trim().length < 6) return "Ange telefonnummer.";
    if (orgNumber.trim().length < 6) return "Ange organisationsnummer.";
    if (requiresDelivery && !selectedAddress) return "Ange leveransadress.";
    return null;
  };

  const buildCheckoutPayload = () => {
    if (!dateSelection || !verification) {
      throw new Error("Bokningen är ofullständig.");
    }
    const deliveryAddress = selectedAddress
      ? `${selectedAddress.street}, ${selectedAddress.zip} ${selectedAddress.city}`.trim()
      : null;

    return {
      productId: product.slug,
      startDate: dateSelection.startDate,
      endDate: dateSelection.endDate,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: phoneValue.trim(),
      orgNumber: orgNumber.trim(),
      deliveryAddress,
      customerNotes: customerNotes.trim() || null,
      verification,
    };
  };

  const handleStartPayment = async () => {
    setSubmitError(null);
    const detailsError = validateDetails();
    if (detailsError) {
      setSubmitError(detailsError);
      return;
    }
    if (!verification) {
      setSubmitError("Du måste godkänna hyresvillkoren innan betalning.");
      return;
    }

    setSubmitting(true);
    try {
      const secret = await initBookingCheckout(buildCheckoutPayload());
      setClientSecret(secret);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Kunde inte starta betalningen."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (paid && summary) {
    return (
      <main className="theme-section">
        <div className="theme-container">
          <div className="theme-card mx-auto max-w-md p-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-accent-muted">
              <svg
                className="h-10 w-10 text-brand-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="theme-heading-md">Betalning reserverad!</h1>
            <p className="theme-body mt-3">
              Beloppet är reserverat på ditt kort. Vi granskar din bokning och
              skickar bekräftelse till din e-post när den är godkänd.
            </p>
            <Link href="/" className="theme-btn-primary mt-8 inline-flex w-full justify-center">
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="theme-section pb-24 sm:pb-16">
      <div className="theme-container max-w-2xl">
        <BookingBackLink />

        <BookingProductHeader product={product} />

        {summary ? (
          <p className="mb-6 rounded-lg border border-brand-border bg-brand-surface-muted px-4 py-3 text-sm text-brand-text-muted">
            <span className="font-semibold text-brand-text">
              {summary.days} {summary.days === 1 ? "dag" : "dagar"}
            </span>
            {" · "}
            {summary.startDate} – {summary.endDate}
            {" · "}
            <span className="font-semibold text-brand-text">
              {summary.total.toLocaleString("sv-SE")} kr
            </span>
          </p>
        ) : null}

        <BookingStepIndicator currentStep={step} />

        <div className="theme-card mt-6 p-5 sm:mt-8 sm:p-8">
          {step === "dates" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-text">Välj datum</h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Ange hyresperiod. Upptagna och blockerade datum kan inte bokas.
                </p>
              </div>
              <BookingCalculator
                slug={product.slug}
                pricePerDay={product.pricePerDay}
                embedded
                initialStartDate={initialStart || undefined}
                initialEndDate={initialEnd || undefined}
                onSelectionChange={setDateSelection}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="theme-btn-primary min-h-[44px] w-full sm:w-auto"
                  disabled={!dateSelection?.canProceed}
                  onClick={() => setStep("details")}
                >
                  Fortsätt
                </button>
              </div>
            </div>
          ) : null}

          {step === "details" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-text">Dina uppgifter</h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Vi behöver kontaktuppgifter för bokningen och eventuell leverans.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="company-name" className="mb-1 block text-sm font-medium text-brand-text">
                    Företagsnamn / Namn
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="org-number" className="mb-1 block text-sm font-medium text-brand-text">
                    Organisationsnummer / Personnummer
                  </label>
                  <input
                    id="org-number"
                    type="text"
                    required
                    value={orgNumber}
                    onChange={(e) => setOrgNumber(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-text">
                      E-post
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1 block text-sm font-medium text-brand-text">
                      Telefon
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-notes" className="mb-1 block text-sm font-medium text-brand-text">
                    Meddelande till oss (valfritt)
                  </label>
                  <textarea
                    id="customer-notes"
                    rows={3}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                {requiresDelivery ? (
                  <div>
                    <label htmlFor="delivery-address" className="mb-1 block text-sm font-medium text-brand-text">
                      Leveransadress
                    </label>
                    <AddressAutocomplete
                      id="delivery-address"
                      onSelect={(addr) => setSelectedAddress(addr)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  className="theme-btn-secondary min-h-[44px] w-full sm:w-auto"
                  onClick={() => setStep("dates")}
                >
                  Tillbaka
                </button>
                <button
                  type="button"
                  className="theme-btn-primary min-h-[44px] w-full sm:w-auto"
                  onClick={() => {
                    const err = validateDetails();
                    if (err) {
                      setSubmitError(err);
                      return;
                    }
                    setSubmitError(null);
                    setStep("agreement");
                  }}
                >
                  Fortsätt
                </button>
              </div>
            </div>
          ) : null}

          {step === "agreement" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-text">Hyresavtal</h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Läs och godkänn hyresvillkoren innan betalning.
                </p>
              </div>

              <AgreementVerificationStep
                productName={product.name}
                agreementText={agreementText}
                verified={verification}
                onVerified={setVerification}
                onClear={() => setVerification(null)}
              />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  className="theme-btn-secondary min-h-[44px] w-full sm:w-auto"
                  onClick={() => setStep("details")}
                >
                  Tillbaka
                </button>
                <button
                  type="button"
                  className="theme-btn-primary min-h-[44px] w-full sm:w-auto"
                  disabled={!verification}
                  onClick={() => {
                    setSubmitError(null);
                    setStep("payment");
                  }}
                >
                  Fortsätt till betalning
                </button>
              </div>
            </div>
          ) : null}

          {step === "payment" && summary ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-text">Betalning</h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                  Beloppet reserveras på ditt kort. Debitering sker när vi
                  godkänt bokningen.
                </p>
              </div>

              <div className="rounded-lg border border-brand-border bg-brand-surface-muted px-4 py-3 text-sm text-brand-text-muted">
                <p>
                  <strong className="text-brand-text">{product.name}</strong>
                </p>
                <p className="mt-1">
                  {summary.startDate} – {summary.endDate} ({summary.days}{" "}
                  {summary.days === 1 ? "dag" : "dagar"})
                </p>
                <p className="mt-1 font-semibold text-brand-text">
                  Totalt {summary.total.toLocaleString("sv-SE")} kr
                </p>
              </div>

              {submitError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-brand-error/30 bg-brand-error/5 px-4 py-3 text-sm text-brand-error"
                >
                  {submitError}
                </p>
              ) : null}

              {!clientSecret ? (
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    className="theme-btn-secondary min-h-[44px] w-full sm:w-auto"
                    onClick={() => setStep("agreement")}
                  >
                    Tillbaka
                  </button>
                  <button
                    type="button"
                    className="theme-btn-primary min-h-[44px] w-full sm:w-auto"
                    disabled={submitting || !verification}
                    onClick={() => void handleStartPayment()}
                  >
                    {submitting ? "Förbereder betalning…" : "Gå till betalning"}
                  </button>
                </div>
              ) : null}

              {clientSecret && stripeReturnUrl ? (
                <StripeCheckoutSection
                  clientSecret={clientSecret}
                  returnUrl={stripeReturnUrl}
                  onSuccess={() => setPaid(true)}
                  onError={(message) => setSubmitError(message)}
                  onBack={() => {
                    setClientSecret(null);
                    setSubmitError(null);
                  }}
                />
              ) : null}
            </div>
          ) : null}

          {submitError && step !== "payment" ? (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-brand-error/30 bg-brand-error/5 px-4 py-3 text-sm text-brand-error"
            >
              {submitError}
            </p>
          ) : null}
        </div>

        {stepIndex > 0 && summary ? (
          <p className="mt-4 text-center text-xs text-brand-text-subtle">
            Steg {stepIndex + 1} av {BOOKING_STEPS.length}
          </p>
        ) : null}
      </div>
    </main>
  );
}
