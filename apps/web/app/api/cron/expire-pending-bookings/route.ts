import { NextResponse } from "next/server";
import { expirePendingBookings } from "@/lib/expire-pending-bookings";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error(
      "cron/expire-pending-bookings: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const result = await expirePendingBookings(supabase);
    console.info("cron/expire-pending-bookings", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to expire pending bookings";
    console.error("cron/expire-pending-bookings", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
