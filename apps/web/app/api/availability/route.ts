import { NextResponse } from "next/server";
import {
  getProductAvailability,
  validateAvailabilityQuery,
} from "@/lib/availability";
import { getSupabase } from "@/lib/supabase";

function corsHeaders(origin: string | null) {
  const allow = origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const supabase = getSupabase();
  const url = new URL(request.url);

  const validated = validateAvailabilityQuery({
    productId: url.searchParams.get("productId"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  if (!supabase) {
    console.error(
      "availability:GET missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return NextResponse.json(
      { error: "Availability is not configured" },
      { status: 503, headers: corsHeaders(origin) }
    );
  }

  try {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("slug")
      .eq("slug", validated.productId)
      .eq("is_active", true)
      .maybeSingle();

    if (productError) {
      console.error("availability:GET product", productError.message, productError);
      return NextResponse.json(
        { error: "Failed to verify product" },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const availability = await getProductAvailability(
      supabase,
      validated.productId,
      validated.from,
      validated.to
    );

    return NextResponse.json(availability, { headers: corsHeaders(origin) });
  } catch (e) {
    console.error("availability:GET", e);
    return NextResponse.json(
      { error: "Failed to read availability" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
