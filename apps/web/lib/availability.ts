import type { SupabaseClient } from "@supabase/supabase-js";
import { listBlockedDateStrings } from "@/lib/blocked-dates";
import { isBookingDateString } from "@/lib/bookings";

const BOOKING_AVAILABILITY_COLUMNS = "start_date, end_date" as const;

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;
const ACTIVE_PAYMENT_STATUSES = [
  "pending",
  "requires_capture",
  "succeeded",
] as const;

function expandDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (current.getTime() <= end.getTime()) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export type ProductAvailability = {
  productId: string;
  from: string;
  to: string;
  blocked: string[];
  booked: string[];
  unavailable: string[];
};

export function validateAvailabilityQuery(params: {
  productId: string | null;
  from: string | null;
  to: string | null;
}):
  | { ok: true; productId: string; from: string; to: string }
  | { ok: false; error: string } {
  const productId = params.productId?.trim() ?? "";
  const from = params.from?.trim() ?? "";
  const to = params.to?.trim() ?? "";

  if (!productId || productId.length > 120) {
    return { ok: false, error: "productId is required" };
  }
  if (!isBookingDateString(from) || !isBookingDateString(to)) {
    return { ok: false, error: "from and to must be YYYY-MM-DD" };
  }
  if (to < from) {
    return { ok: false, error: "to must be on or after from" };
  }

  return { ok: true, productId, from, to };
}

/** Dates that cannot be booked for a product (global blocks + active bookings). */
export async function getProductAvailability(
  supabase: SupabaseClient,
  productId: string,
  from: string,
  to: string
): Promise<ProductAvailability> {
  const unavailable = new Set<string>();
  const blocked = new Set<string>();
  const booked = new Set<string>();

  const blockedDates = await listBlockedDateStrings(supabase, { from, to });
  for (const date of blockedDates) {
    blocked.add(date);
    unavailable.add(date);
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(BOOKING_AVAILABILITY_COLUMNS)
    .eq("product_id", productId)
    .in("status", [...ACTIVE_BOOKING_STATUSES])
    .in("payment_status", [...ACTIVE_PAYMENT_STATUSES])
    .lte("start_date", to)
    .gte("end_date", from);

  if (bookingsError) {
    console.error(
      "availability:bookings",
      bookingsError.message,
      bookingsError
    );
    throw bookingsError;
  }

  for (const row of bookings ?? []) {
    const booking = row as { start_date: string; end_date: string };
    if (
      !isBookingDateString(booking.start_date) ||
      !isBookingDateString(booking.end_date)
    ) {
      continue;
    }
    for (const date of expandDateRange(booking.start_date, booking.end_date)) {
      if (date >= from && date <= to) {
        booked.add(date);
        unavailable.add(date);
      }
    }
  }

  const sortDates = (set: Set<string>) => [...set].sort();

  return {
    productId,
    from,
    to,
    blocked: sortDates(blocked),
    booked: sortDates(booked),
    unavailable: sortDates(unavailable),
  };
}
