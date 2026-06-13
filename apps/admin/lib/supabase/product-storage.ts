import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGES_BUCKET = "product-images";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function mimeToExt(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

function safeFileExtension(file: File): string | null {
  const fromMime = mimeToExt(file.type);
  if (fromMime) return fromMime;
  const parts = file.name.split(".");
  const last = parts.length >= 2 ? parts[parts.length - 1]?.toLowerCase() : undefined;
  if (last && /^[a-z0-9]{2,5}$/.test(last)) return last;
  return null;
}

/**
 * Laddar upp en bild till bucket `product-images` och returnerar publik URL (för `products.image`).
 */
export async function uploadProductImage(
  client: SupabaseClient,
  userId: string,
  pathSlug: string,
  file: File
): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Endast JPEG, PNG, WebP eller GIF är tillåtna.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Bilden får vara högst 5 MB.");
  }
  const ext = safeFileExtension(file);
  if (!ext) {
    throw new Error("Kunde inte avgöra filändelse. Använd jpg, png, webp eller gif.");
  }
  const safeSlug = pathSlug.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").slice(0, 80) || "objekt";
  const objectPath = `${userId}/${safeSlug}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) {
    console.error("product-storage: upload", uploadError.message, uploadError);
    throw new Error(uploadError.message || "Uppladdningen misslyckades.");
  }

  const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);
  const url = data.publicUrl;
  if (!url) {
    throw new Error("Kunde inte hämta publik URL för bilden.");
  }
  return url;
}
