"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  PRODUCTS,
  calculateTotal,
  requiresDeliveryAddress,
} from "@/lib/products";
import { AddressAutocomplete } from "@/components/address-autocomplete";

const AVTAL_LOREM = `
1. Allmänna villkor
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Hyresgästen förbinder sig att använda utrustningen enligt tillverkarens anvisningar och att återlämna den i samma skick som vid utlämning, med undantag för normal slitage.

2. Ansvar och skador
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Hyresgästen är ansvarig för alla skador som uppstår under hyresperioden, oavsett orsak. Skador som inte rapporteras vid återlämning debiteras hyresgästen. Vid förlust eller totalförstörelse gäller ersättning enligt nyvärde.

3. Återlämning
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. Utrustningen ska återlämnas senast kl. 12:00 på sista hyresdagen till angiven adress. Sen återlämning debiteras med dubbel dygnsavgift per påbörjat dygn. Vid uthämtning hos kund gäller avtalad tid; sen upphämtning kan medföra väntetidsavgift.

4. Betalning och deposition
Excepteur sint occaecat cupidatat non proident. Betalning sker enligt faktura med 30 dagars betalningsvillkor. Vid misstänkt skada eller försenad återlämning kan deposition kvarhållas tills ärendet är utrett. Eventuell rest ska återbetalas inom 14 dagar efter avslutad hyra.

5. Force majeure
Sunt in culpa qui officia deserunt mollit anim id est laborum. Vid force majeure (brand, naturkatastrof, krig, strejk m.m.) är hyresvärden befriad från ansvar för utebliven leverans eller återhämtning. Redan betalda belopp återbetalas i så fall proportionellt.
`.trim();

function AvtalModal({
  productName,
  open,
  onClose,
  onSigned,
}: {
  productName: string;
  open: boolean;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [bankIdStatus, setBankIdStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  useEffect(() => {
    if (open) setBankIdStatus("idle");
  }, [open]);

  if (!open) return null;

  const handleSign = () => {
    setBankIdStatus("loading");
    // Simulera BankID: 2–3 sekunder
    setTimeout(() => {
      setBankIdStatus("success");
      onSigned();
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 2500);
  };

  const handleClose = () => {
    if (bankIdStatus !== "loading") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avtal-modal-title"
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <h2
            id="avtal-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            Hyresavtal för {productName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Läs avtalet nedan och signera med BankID för att godkänna.
          </p>
        </div>

        <div className="max-h-[400px] overflow-y-auto border-b border-slate-200 px-6 py-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {AVTAL_LOREM}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4">
          {bankIdStatus === "success" ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-100 py-3 text-sm font-medium text-emerald-800">
              <span aria-hidden>✅</span>
              Signerat med BankID
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSign}
              disabled={bankIdStatus === "loading"}
              className="w-full rounded-lg bg-[#005AA0] py-3 font-semibold text-white transition hover:bg-[#004d8c] disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#005AA0] focus:ring-offset-2"
            >
              {bankIdStatus === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden
                  />
                  Väntar på BankID...
                </span>
              ) : (
                "Signera med BankID"
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            disabled={bankIdStatus === "loading"}
            className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
}

type PaymentMethod = "swish" | "card";

function PaymentModal({
  open,
  onClose,
  total,
  defaultPhone,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  defaultPhone: string;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("swish");
  const [swishPhone, setSwishPhone] = useState(defaultPhone);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [status, setStatus] = useState<
    "idle" | "swish_waiting" | "card_processing"
  >("idle");

  // Synca defaultPhone när modalen öppnas
  useEffect(() => {
    if (open) {
      setSwishPhone(defaultPhone);
      setStatus("idle");
    }
  }, [open, defaultPhone]);

  if (!open) return null;

  const handleSwishPay = () => {
    setStatus("swish_waiting");
    setTimeout(() => {
      setStatus("idle");
      onPaid();
      onClose();
    }, 3000);
  };

  const handleCardPay = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("card_processing");
    setTimeout(() => {
      setStatus("idle");
      onPaid();
      onClose();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <h2
            id="payment-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            Välj betalningsmetod
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Betala {total.toLocaleString("sv-SE")} kr
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMethod("swish")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              method === "swish"
                ? "border-b-2 border-amber-500 text-amber-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Swish
          </button>
          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              method === "card"
                ? "border-b-2 border-amber-500 text-amber-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Kort
          </button>
        </div>

        <div className="p-6">
          {method === "swish" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-[#C3E8BD] p-3">
                <span className="text-2xl font-bold text-[#0F7B2E]">Swish</span>
              </div>
              <div>
                <label
                  htmlFor="swish-phone"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Mobilnummer
                </label>
                <input
                  id="swish-phone"
                  type="tel"
                  value={swishPhone}
                  onChange={(e) => setSwishPhone(e.target.value)}
                  placeholder="070 123 45 67"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              {status === "swish_waiting" ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div
                    className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"
                    aria-hidden
                  />
                  <p className="text-sm font-medium text-slate-700">
                    Öppna din Swish-app och godkänn betalningen...
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSwishPay}
                  className="w-full rounded-xl bg-[#0F7B2E] py-3.5 font-semibold text-white transition hover:bg-[#0c6b26] focus:outline-none focus:ring-2 focus:ring-[#0F7B2E] focus:ring-offset-2"
                >
                  Betala med Swish
                </button>
              )}
            </div>
          )}

          {method === "card" && (
            <form onSubmit={handleCardPay} className="space-y-4">
              <div>
                <label
                  htmlFor="card-number"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Kortnummer
                </label>
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 16),
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="card-expiry"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Giltighetstid (MM/ÅÅ)
                  </label>
                  <input
                    id="card-expiry"
                    type="text"
                    placeholder="12/28"
                    maxLength={5}
                    value={expiry}
                    onChange={(e) =>
                      setExpiry(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4)
                          .replace(/(\d{2})/, "$1/")
                          .replace(/\/$/, ""),
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="card-cvc"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    CVC
                  </label>
                  <input
                    id="card-cvc"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              {status === "card_processing" ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div
                    className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"
                    aria-hidden
                  />
                  <p className="text-sm font-medium text-slate-700">
                    Bearbetar transaktion...
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Betala {total.toLocaleString("sv-SE")} kr
                </button>
              )}
            </form>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={status !== "idle"}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}

function KassaContent() {
  const searchParams = useSearchParams();
  const productSlug = searchParams.get("product") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  const [signed, setSigned] = useState(false);
  const [paid, setPaid] = useState(false);
  const [avtalModalOpen, setAvtalModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<{
    street: string;
    zip: string;
    city: string;
  } | null>(null);

  const { product, days, total, valid } = useMemo(() => {
    const p = productSlug ? PRODUCTS[productSlug] : null;
    if (!p || !start || !end) {
      return { product: null, days: 0, total: 0, valid: false };
    }
    const { days: d, total: t } = calculateTotal(p.pricePerDay, start, end);
    return { product: p, days: d, total: t, valid: true };
  }, [productSlug, start, end]);

  const showDeliveryAddress = productSlug
    ? requiresDeliveryAddress(productSlug)
    : false;

  // Success-vy efter betalning
  if (valid && product && paid) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-10 w-10 text-emerald-600"
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
          <h1 className="text-2xl font-bold text-slate-900">
            Bokning bekräftad!
          </h1>
          <p className="mt-2 text-slate-600">
            Kvitto har skickats till din e-post.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block w-full rounded-xl bg-amber-500 py-3.5 font-semibold text-slate-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Tillbaka till startsidan
          </Link>
        </div>
      </main>
    );
  }

  if (!valid || !product) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Saknad bokningsinformation
          </h1>
          <p className="mt-2 text-slate-600">
            Produkt, startdatum eller slutdatum saknas. Börja med att välja
            produkt och datum på produktsidan.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-900 hover:bg-amber-400"
          >
            Till startsidan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/produkt/${productSlug}?start=${start}&end=${end}`}
          className="mb-6 inline-flex items-center text-sm font-medium text-slate-600 hover:text-amber-700"
        >
          ← Ändra bokning
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
            <h1 className="text-xl font-bold text-slate-900">Kassa</h1>
            <p className="mt-2 text-slate-700">
              Du bokar <strong>{product.name}</strong> i{" "}
              <strong>
                {days} {days === 1 ? "dag" : "dagar"}
              </strong>
              . Totalpris: <strong>{total.toLocaleString("sv-SE")} kr</strong>.
            </p>
          </div>

          <form
            className="p-6"
            onSubmit={(e) => {
              e.preventDefault();
              // Här kan du senare skicka till API / bekräftelse
            }}
          >
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="company-name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Företagsnamn / Namn
                </label>
                <input
                  id="company-name"
                  name="companyName"
                  type="text"
                  required
                  placeholder="Företag AB eller Förnamn Efternamn"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="org-number"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Organisationsnummer / Personnummer
                </label>
                <input
                  id="org-number"
                  name="orgNumber"
                  type="text"
                  required
                  placeholder="XXXXXX-XXXX eller XXXXXX-XXXX"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    E-post
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Telefon
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {showDeliveryAddress && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="delivery-address"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Leveransadress
                    </label>
                    <AddressAutocomplete
                      id="delivery-address"
                      onSelect={(addr) => setSelectedAddress(addr)}
                      className="mt-1"
                    />
                    <input
                      type="hidden"
                      name="deliveryAddress"
                      value={
                        selectedAddress
                          ? `${selectedAddress.street}, ${selectedAddress.zip} ${selectedAddress.city}`
                          : ""
                      }
                      readOnly
                      required
                      aria-required="true"
                    />
                  </div>
                  {selectedAddress && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="delivery-zip"
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Postnummer
                        </label>
                        <input
                          id="delivery-zip"
                          type="text"
                          readOnly
                          value={selectedAddress.zip}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
                          tabIndex={-1}
                          aria-readonly="true"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="delivery-city"
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Ort
                        </label>
                        <input
                          id="delivery-city"
                          type="text"
                          readOnly
                          value={selectedAddress.city}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
                          tabIndex={-1}
                          aria-readonly="true"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setAvtalModalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/80 py-4 text-sm font-medium text-slate-700 transition hover:border-amber-400 hover:bg-amber-50/50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <span aria-hidden>📄</span>
                  Läs och Signera Avtal
                </button>
                <p
                  className={`text-sm font-medium ${
                    signed ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {signed ? (
                    <>
                      <span aria-hidden>✅</span> Signerat med BankID
                    </>
                  ) : (
                    "Väntar på underskrift..."
                  )}
                </p>
              </div>

              {signed ? (
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  className="mt-6 w-full rounded-xl bg-amber-500 py-3.5 font-semibold text-slate-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Gå till betalning
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-300 py-3.5 font-semibold text-slate-500"
                >
                  Slutför bokning
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        total={total}
        defaultPhone={phoneValue}
        onPaid={() => setPaid(true)}
      />

      <AvtalModal
        productName={product.name}
        open={avtalModalOpen}
        onClose={() => setAvtalModalOpen(false)}
        onSigned={() => setSigned(true)}
      />
    </main>
  );
}

function KassaFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 sm:px-8">
      <div className="mx-auto max-w-2xl animate-pulse rounded-xl border border-slate-200 bg-white p-8">
        <div className="h-6 w-1/3 rounded bg-slate-200" />
        <div className="mt-4 h-4 w-full rounded bg-slate-100" />
        <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
      </div>
    </main>
  );
}

export default function KassaPage() {
  return (
    <Suspense fallback={<KassaFallback />}>
      <KassaContent />
    </Suspense>
  );
}
