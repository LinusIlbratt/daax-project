import Image from "next/image";
import Link from "next/link";
import type { ProductData } from "@/lib/products-data";
import { resolveProductImageUrl } from "@/lib/product-image";

function ProductImagePlaceholder({ name }: { name: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 bg-brand-surface-muted px-4 text-center"
      aria-hidden
    >
      <svg
        className="h-9 w-9 text-brand-text-subtle"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <span className="text-xs text-brand-text-subtle">{name}</span>
    </div>
  );
}

export function RentalProductCard({ product }: { product: ProductData }) {
  const imageSrc = resolveProductImageUrl(product.image);

  return (
    <article className="theme-card-interactive group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-brand-border/60 bg-brand-surface-muted">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        ) : (
          <ProductImagePlaceholder name={product.name} />
        )}
        {product.requiresDelivery ? (
          <span className="absolute left-3 top-3 rounded-md border border-brand-border/60 bg-brand-surface/95 px-2 py-1 text-[11px] font-medium text-brand-text-muted backdrop-blur-sm">
            Leverans
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="text-base font-semibold text-brand-text">{product.name}</h2>
        {product.info ? (
          <p className="mt-1 text-sm text-brand-accent">{product.info}</p>
        ) : null}
        <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-text-muted line-clamp-3">
          {product.description}
        </p>
        <div className="mt-5 flex flex-col gap-3 border-t border-brand-border-muted pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-brand-text">
            {product.pricePerDay.toLocaleString("sv-SE")}{" "}
            <span className="font-normal text-brand-text-muted">kr/dygn</span>
          </p>
          <Link
            href={`/boka/${encodeURIComponent(product.slug)}`}
            className="theme-btn-primary w-full justify-center sm:w-auto"
          >
            Boka
          </Link>
        </div>
      </div>
    </article>
  );
}
