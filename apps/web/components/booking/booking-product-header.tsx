import Image from "next/image";
import Link from "next/link";
import type { ProductData } from "@/lib/products-data";
import { resolveProductImageUrl } from "@/lib/product-image";
import { siteContent } from "@/theme/site-content";

export function BookingProductHeader({ product }: { product: ProductData }) {
  const imageSrc = resolveProductImageUrl(product.image);

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-brand-surface-muted sm:h-20 sm:w-32">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-brand-text-subtle">
            {product.name}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="theme-label">Boka online</p>
        <h1 className="theme-heading-md mt-1 truncate">{product.name}</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          fr {product.pricePerDay.toLocaleString("sv-SE")} kr/dygn
          {product.requiresDelivery ? " · Leverans ingår" : null}
        </p>
      </div>
    </div>
  );
}

export function BookingBackLink() {
  return (
    <Link
      href="/"
      className="mb-4 inline-flex min-h-[44px] items-center text-sm font-medium text-brand-text-muted hover:text-brand-text"
    >
      ← {siteContent.booking.backToCatalog}
    </Link>
  );
}
