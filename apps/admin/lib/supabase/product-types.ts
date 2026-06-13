/**
 * Types aligned with `public.products` in Supabase (see supabase/schema.sql).
 */

export const PRODUCT_CATEGORIES = ["entreprenad", "event"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Full row select (t.ex. vid behov av alla fält) — undvik på stora listor. */
export const PRODUCTS_LIST_COLUMNS =
  "slug, name, price_per_day, price_per_week, price_per_month, description, category, image, agreement, info, requires_delivery, is_active, created_by, created_at, updated_at" as const;

/** Endast kolumner som inventeringslistan behöver (ingen `*`). */
export const PRODUCTS_INVENTORY_LIST_COLUMNS =
  "slug, name, category, price_per_day, price_per_week, price_per_month, is_active, requires_delivery, image" as const;

export type ProductInventoryListRow = {
  slug: string;
  name: string;
  category: ProductCategory;
  price_per_day: number;
  price_per_week: number;
  price_per_month: number;
  is_active: boolean;
  requires_delivery: boolean;
  image: string;
};

export type ProductRow = {
  slug: string;
  name: string;
  price_per_day: number;
  price_per_week: number;
  price_per_month: number;
  description: string;
  category: ProductCategory;
  image: string;
  agreement: string;
  info: string | null;
  requires_delivery: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Payload for inserting a new row from admin UI (DB defaults fill the rest). */
export type ProductInsert = {
  slug: string;
  name: string;
  price_per_day: number;
  price_per_week: number;
  price_per_month: number;
  description: string;
  category: ProductCategory;
  image: string;
  agreement: string;
  info: string | null;
  requires_delivery: boolean;
  is_active: boolean;
  created_by: string;
};

/** Fält som uppdateras vid redigering (slug är primärnyckel och ändras inte). */
export type ProductUpdatePayload = {
  name: string;
  price_per_day: number;
  price_per_week: number;
  price_per_month: number;
  description: string;
  category: ProductCategory;
  image: string;
  agreement: string;
  info: string | null;
  requires_delivery: boolean;
  is_active: boolean;
};

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

export function parseProductInventoryListRow(raw: unknown): ProductInventoryListRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const slug = r.slug;
  const name = r.name;
  if (typeof slug !== "string" || typeof name !== "string") return null;
  const category = r.category;
  if (typeof category !== "string" || !isProductCategory(category)) return null;
  const price_per_day = Number(r.price_per_day);
  const price_per_week = Number(r.price_per_week);
  const price_per_month = Number(r.price_per_month);
  if (!Number.isFinite(price_per_day) || !Number.isFinite(price_per_week) || !Number.isFinite(price_per_month)) {
    return null;
  }
  const image = r.image;
  if (typeof image !== "string") return null;
  return {
    slug,
    name,
    category,
    price_per_day,
    price_per_week,
    price_per_month,
    is_active: Boolean(r.is_active),
    requires_delivery: Boolean(r.requires_delivery),
    image,
  };
}

export function parseProductRow(raw: unknown): ProductRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const slug = r.slug;
  const name = r.name;
  if (typeof slug !== "string" || typeof name !== "string") return null;
  const category = r.category;
  if (typeof category !== "string" || !isProductCategory(category)) return null;
  const description = r.description;
  if (typeof description !== "string") return null;

  const price_per_day = Number(r.price_per_day);
  const price_per_week = Number(r.price_per_week);
  const price_per_month = Number(r.price_per_month);
  if (!Number.isFinite(price_per_day) || !Number.isFinite(price_per_week) || !Number.isFinite(price_per_month)) {
    return null;
  }

  const image = r.image;
  const agreement = r.agreement;
  if (typeof image !== "string" || typeof agreement !== "string") return null;

  const info = r.info;
  if (info !== null && info !== undefined && typeof info !== "string") return null;

  const requires_delivery = Boolean(r.requires_delivery);
  const is_active = Boolean(r.is_active);

  const created_by = r.created_by;
  if (created_by !== null && created_by !== undefined && typeof created_by !== "string") return null;

  const created_at = r.created_at;
  const updated_at = r.updated_at;
  if (typeof created_at !== "string" || typeof updated_at !== "string") return null;

  return {
    slug,
    name,
    price_per_day,
    price_per_week,
    price_per_month,
    description,
    category,
    image,
    agreement,
    info: info === undefined ? null : info,
    requires_delivery,
    is_active,
    created_by: created_by ?? null,
    created_at,
    updated_at,
  };
}
