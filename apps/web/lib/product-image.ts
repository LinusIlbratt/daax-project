/**
 * Resolves product.image from DB/Storage to a URL usable by next/image or <img>.
 */
export function resolveProductImageUrl(image: string | null | undefined): string | null {
  const trimmed = (image ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
