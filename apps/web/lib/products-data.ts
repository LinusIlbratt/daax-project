import { readFileSync } from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import { getSupabase } from "./supabase";

const DATA_PATH = path.join(process.cwd(), "data", "products.json");
const PRODUCTS_CACHE_TAG = "products";
const PRODUCTS_REVALIDATE_SEC = 60;

const PRODUCT_LIST_COLUMNS =
  "slug, name, price_per_day, description, category, image, agreement, info, requires_delivery" as const;

export type ProductData = {
  slug: string;
  name: string;
  pricePerDay: number;
  description: string;
  category: "entreprenad" | "event";
  image: string;
  agreement: string;
  info: string | null;
  requiresDelivery?: boolean;
};

function rowToProduct(row: {
  slug: string;
  name: string;
  price_per_day: number;
  description: string;
  category: string;
  image: string | null;
  agreement: string;
  info: string | null;
  requires_delivery: boolean | null;
}): ProductData {
  return {
    slug: row.slug,
    name: row.name,
    pricePerDay: row.price_per_day,
    description: row.description,
    category: row.category as ProductData["category"],
    image: row.image ?? "",
    agreement: row.agreement,
    info: row.info,
    requiresDelivery: row.requires_delivery ?? false,
  };
}

function fromFile(): ProductData[] {
  try {
    const data = readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(data) as ProductData[];
  } catch {
    return [];
  }
}

async function fetchProductsUncached(): Promise<ProductData[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_LIST_COLUMNS)
        .eq("is_active", true)
        .order("slug");
      if (!error && data) return data.map(rowToProduct);
    } catch (e) {
      console.error("products-data:fetch", e);
    }
  }
  return fromFile();
}

const getCachedProducts = unstable_cache(
  fetchProductsUncached,
  ["products-list"],
  { revalidate: PRODUCTS_REVALIDATE_SEC, tags: [PRODUCTS_CACHE_TAG] }
);

export async function getProducts(): Promise<ProductData[]> {
  return getCachedProducts();
}

export async function getProductBySlug(
  slug: string
): Promise<ProductData | undefined> {
  const list = await getProducts();
  return list.find((p) => p.slug === slug);
}

export async function getProductsByCategory(
  category: "entreprenad" | "event"
): Promise<ProductData[]> {
  const list = await getProducts();
  return list.filter((p) => p.category === category);
}
