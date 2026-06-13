import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { confirmBookingWithEmail } from "../lib/bookings/confirm-booking";

function loadEnv(file: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let val = t.slice(i + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[t.slice(0, i)] = val;
  }
  return env;
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const adminEnv = loadEnv(resolve(root, ".env"));
  const webEnv = loadEnv(resolve(root, "../web/.env.local"));

  process.env.STRIPE_SECRET_KEY = adminEnv.STRIPE_SECRET_KEY;
  process.env.RESEND_API_KEY = adminEnv.RESEND_API_KEY;
  process.env.RESEND_FROM_EMAIL = adminEnv.RESEND_FROM_EMAIL;

  const bookingId = process.argv[2]?.trim();
  if (!bookingId) {
    console.error("Usage: tsx scripts/confirm-booking-test.ts <booking-id>");
    process.exit(1);
  }

  const supabase = createClient(
    webEnv.SUPABASE_URL,
    webEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  const result = await confirmBookingWithEmail(supabase, bookingId);
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exit(1);
  }

  const { data } = await supabase
    .from("bookings")
    .select(
      "status, payment_status, confirmation_email_sent_at, customer_email"
    )
    .eq("id", bookingId)
    .maybeSingle();

  console.log("BOOKING", JSON.stringify(data, null, 2));
  process.exit(result.emailSent ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
