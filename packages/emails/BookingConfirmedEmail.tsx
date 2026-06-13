import React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { formatSEK } from "./lib/format";

export type BookingConfirmedEmailProps = {
  customerName: string;
  productName: string;
  periodLabel: string;
  totalPrice: number;
  deliveryAddress: string | null;
  requiresDelivery: boolean;
  deliveryTimeWindow?: string;
};

export function BookingConfirmedEmail({
  customerName,
  productName,
  periodLabel,
  totalPrice,
  deliveryAddress,
  requiresDelivery,
  deliveryTimeWindow = "09:00–12:00",
}: BookingConfirmedEmailProps) {
  const showDelivery = requiresDelivery && deliveryAddress;

  return (
    <EmailLayout
      preview="Din bokning är bekräftad"
      title="Din bokning är bekräftad"
    >
      <Text className="m-0 text-base text-slate-700">
        Hej {customerName},
      </Text>
      <Text className="mt-4 text-base text-slate-700">
        Goda nyheter – din bokning är nu{" "}
        <strong className="text-emerald-700">bekräftad</strong>. Nedan finns
        en sammanfattning och information om utlämning eller leverans.
      </Text>

      <Section className="mt-6 rounded-lg bg-emerald-50 px-5 py-4">
        <Text className="m-0 text-sm font-semibold text-emerald-900">
          Bokningsdetaljer
        </Text>
        <Text className="mb-1 mt-3 text-sm text-slate-700">
          <span className="font-medium text-slate-900">Produkt:</span>{" "}
          {productName}
        </Text>
        <Text className="mb-1 mt-1 text-sm text-slate-700">
          <span className="font-medium text-slate-900">Period:</span>{" "}
          {periodLabel}
        </Text>
        <Text className="mb-0 mt-1 text-sm text-slate-700">
          <span className="font-medium text-slate-900">Totalpris:</span>{" "}
          {formatSEK(totalPrice)}
        </Text>
      </Section>

      <Section className="mt-4 rounded-lg bg-slate-50 px-5 py-4">
        <Text className="m-0 text-sm font-semibold text-slate-900">
          {showDelivery ? "Leverans" : "Utlämning"}
        </Text>
        {showDelivery ? (
          <>
            <Text className="mt-3 text-sm text-slate-700">
              Vi kör ut till följande adress enligt överenskommen leveransdag:
            </Text>
            <Text className="mt-2 text-sm font-medium text-slate-900">
              {deliveryAddress}
            </Text>
            <Text className="mt-3 text-sm text-slate-600">
              Beräknad leveranstid: {deliveryTimeWindow}
            </Text>
          </>
        ) : (
          <Text className="mt-3 text-sm text-slate-700">
            Utrustningen kan hämtas hos oss enligt överenskommen tid. Kontakta
            oss om du behöver ändra upphämtningstid.
          </Text>
        )}
      </Section>

      <Text className="mt-6 text-sm text-slate-600">
        Vi ser fram emot att hjälpa dig. Vid frågor, hör av dig via telefon
        eller e-post.
      </Text>
    </EmailLayout>
  );
}

export function bookingConfirmedSubject(productName: string): string {
  return `Bokning bekräftad – ${productName}`;
}
