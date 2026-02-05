import { readFileSync } from "fs";
import path from "path";
import { getSupabase } from "./supabase";

const DATA_PATH = path.join(process.cwd(), "data", "products.json");

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

export async function getProducts(): Promise<ProductData[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("slug");
      if (!error && data) return data.map(rowToProduct);
    } catch {
      // fall through to file
    }
  }
  return fromFile();
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
