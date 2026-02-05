import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { getSupabase } from "@/lib/supabase";

const DATA_PATH = path.join(process.cwd(), "data", "products.json");

export type ApiProduct = {
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

function corsHeaders(origin: string | null) {
  const allow = origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function rowToApi(row: {
  slug: string;
  name: string;
  price_per_day: number;
  description: string;
  category: string;
  image: string | null;
  agreement: string;
  info: string | null;
  requires_delivery: boolean | null;
}): ApiProduct {
  return {
    slug: row.slug,
    name: row.name,
    pricePerDay: row.price_per_day,
    description: row.description,
    category: row.category as ApiProduct["category"],
    image: row.image ?? "",
    agreement: row.agreement,
    info: row.info,
    requiresDelivery: row.requires_delivery ?? false,
  };
}

function apiToRow(p: ApiProduct) {
  return {
    slug: p.slug,
    name: p.name,
    price_per_day: p.pricePerDay,
    description: p.description,
    category: p.category,
    image: p.image || "",
    agreement: p.agreement,
    info: p.info,
    requires_delivery: p.requiresDelivery ?? false,
  };
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("slug");
      if (error) throw error;
      const products = (data ?? []).map(rowToApi);
      return NextResponse.json(products, {
        headers: corsHeaders(origin),
      });
    } catch (e) {
      console.error("Supabase GET products:", e);
      return NextResponse.json(
        { error: "Failed to read products" },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
  }

  try {
    const data = readFileSync(DATA_PATH, "utf-8");
    const products = JSON.parse(data) as ApiProduct[];
    return NextResponse.json(products, {
      headers: corsHeaders(origin),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to read products" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  const supabase = getSupabase();

  if (supabase) {
    try {
      const body = await request.json();
      const products = body.products as ApiProduct[];
      if (!Array.isArray(products)) {
        return NextResponse.json(
          { error: "products must be an array" },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      const rows = products.map(apiToRow);
      const { error } = await supabase.from("products").upsert(rows, {
        onConflict: "slug",
      });
      if (error) throw error;
      return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
    } catch (e) {
      console.error("Supabase PUT products:", e);
      return NextResponse.json(
        { error: "Failed to write products" },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
  }

  try {
    const body = await request.json();
    const products = body.products as ApiProduct[];
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: "products must be an array" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }
    writeFileSync(DATA_PATH, JSON.stringify(products, null, 2), "utf-8");
    return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to write products" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
