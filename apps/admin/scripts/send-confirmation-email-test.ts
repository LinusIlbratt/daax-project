import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  formatBookingPeriod,
  sendBookingConfirmedEmail,
} from "@booking-system/emails";

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

  process.env.RESEND_API_KEY = adminEnv.RESEND_API_KEY;
  process.env.RESEND_FROM_EMAIL = adminEnv.RESEND_FROM_EMAIL;

  const bookingId = process.argv[2]?.trim();
  if (!bookingId) {
    console.error("Usage: tsx scripts/send-confirmation-email-test.ts <booking-id>");
    process.exit(1);
  }

  const supabase = createClient(
    webEnv.SUPABASE_URL,
    webEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: row, error } = await supabase
    .from("bookings")
    .select(
      "id, status, customer_name, customer_email, start_date, end_date, total_price, delivery_address, product_id, confirmation_email_sent_at, products(name, requires_delivery)"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !row) {
    console.error("fetch", error?.message ?? "not found");
    process.exit(1);
  }

  if (row.confirmation_email_sent_at) {
    console.log("Already sent at", row.confirmation_email_sent_at);
    process.exit(0);
  }

  const productName =
    row.products && typeof row.products === "object" && !Array.isArray(row.products)
      ? (row.products as { name: string }).name
      : row.product_id;

  const requiresDelivery =
    row.products &&
    typeof row.products === "object" &&
    !Array.isArray(row.products)
      ? Boolean((row.products as { requires_delivery?: boolean }).requires_delivery)
      : false;

  const emailResult = await sendBookingConfirmedEmail(row.customer_email, {
    customerName: row.customer_name,
    productName,
    periodLabel: formatBookingPeriod(row.start_date, row.end_date),
    totalPrice: row.total_price,
    deliveryAddress: row.delivery_address,
    requiresDelivery,
    deliveryTimeWindow: "09:00–12:00",
  });

  console.log(JSON.stringify(emailResult, null, 2));

  if (emailResult.ok) {
    await supabase
      .from("bookings")
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq("id", bookingId);
    process.exit(0);
  }

  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
