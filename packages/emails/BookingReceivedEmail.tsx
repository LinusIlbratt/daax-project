import React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { formatBookingPeriod, formatSEK } from "./lib/format";

export type BookingReceivedEmailProps = {
  customerName: string;
  productName: string;
  periodLabel: string;
  totalPrice: number;
};

export function BookingReceivedEmail({
  customerName,
  productName,
  periodLabel,
  totalPrice,
}: BookingReceivedEmailProps) {
  return (
    <EmailLayout
      preview="Vi har mottagit din bokningsförfrågan"
      title="Tack – vi har tagit emot din bokning"
    >
      <Text className="m-0 text-base text-slate-700">
        Hej {customerName},
      </Text>
      <Text className="mt-4 text-base text-slate-700">
        Vi har mottagit din bokningsförfrågan. Den är{" "}
        <strong className="text-amber-700">preliminär</strong> tills vårt team
        har granskat och bekräftat den. Du får ett nytt e-postmeddelande när
        bokningen är godkänd.
      </Text>

      <Section className="mt-6 rounded-lg bg-slate-50 px-5 py-4">
        <Text className="m-0 text-sm font-semibold text-slate-900">
          Din förfrågan
        </Text>
        <Text className="mb-1 mt-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Produkt:</span>{" "}
          {productName}
        </Text>
        <Text className="mb-1 mt-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Period:</span>{" "}
          {periodLabel}
        </Text>
        <Text className="mb-0 mt-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Totalpris:</span>{" "}
          {formatSEK(totalPrice)}
        </Text>
      </Section>

      <Text className="mt-6 text-sm text-slate-600">
        Har du frågor under tiden? Kontakta oss via telefon eller e-post så
        hjälper vi dig.
      </Text>
    </EmailLayout>
  );
}

export function bookingReceivedSubject(productName: string): string {
  return `Bokningsförfrågan mottagen – ${productName}`;
}

export { formatBookingPeriod };
