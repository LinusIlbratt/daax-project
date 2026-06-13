import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { resolveAgreementText } from "@/lib/agreement-texts";
import { getProductBySlug } from "@/lib/products-data";
import { siteContent } from "@/theme/site-content";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Boka" };
  }

  const description =
    product.description.trim().slice(0, 160) ||
    `Boka ${product.name} online hos ${siteContent.brand.legalName}.`;

  return {
    title: `Boka ${product.name}`,
    description,
  };
}

function BookingFallback() {
  return (
    <main className="theme-section">
      <div className="theme-container max-w-2xl">
        <div className="theme-card animate-pulse p-8">
          <div className="h-6 w-1/3 rounded bg-brand-surface-muted" />
          <div className="mt-4 h-4 w-full rounded bg-brand-surface-muted" />
          <div className="mt-4 h-4 w-2/3 rounded bg-brand-surface-muted" />
        </div>
      </div>
    </main>
  );
}

export default async function BokaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const agreementText = resolveAgreementText(product.agreement);

  return (
    <Suspense fallback={<BookingFallback />}>
      <BookingWizard product={product} agreementText={agreementText} />
    </Suspense>
  );
}
