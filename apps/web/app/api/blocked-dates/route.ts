import { NextResponse } from "next/server";
import { listBlockedDateStrings } from "@/lib/blocked-dates";
import { getSupabase } from "@/lib/supabase";

function corsHeaders(origin: string | null) {
  const allow = origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/** All blocked dates (global) — used by customer booking flows. */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const supabase = getSupabase();
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.trim() ?? undefined;
  const to = url.searchParams.get("to")?.trim() ?? undefined;

  if (!supabase) {
    console.error(
      "blocked-dates:GET missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return NextResponse.json(
      { error: "Blocked dates are not configured" },
      { status: 503, headers: corsHeaders(origin) }
    );
  }

  try {
    const dates = await listBlockedDateStrings(supabase, { from, to });
    return NextResponse.json({ dates }, { headers: corsHeaders(origin) });
  } catch (e) {
    console.error("blocked-dates:GET", e);
    return NextResponse.json(
      { error: "Failed to read blocked dates" },
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
