import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BOOKING_PAYMENT_STATUSES,
  BOOKING_STATUSES,
  type BookingPaymentStatus,
  type BookingStatus,
} from "@booking-system/types";

export { BOOKING_STATUSES, type BookingStatus };
export type { BookingPaymentStatus };

export const BOOKINGS_LIST_SELECT =
  "id, product_id, customer_name, customer_email, customer_phone, start_date, end_date, total_price, status, payment_status, delivery_address, org_number, customer_notes, terms_accepted_at, accepted_agreement_snapshot, booking_received_email_sent_at, confirmation_email_sent_at, products(name, image)" as const;

export type BookingProductEmbed = {
  name: string;
  image: string;
};

export type BookingListRow = {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: BookingStatus;
  payment_status: BookingPaymentStatus;
  delivery_address: string | null;
  org_number: string | null;
  customer_notes: string | null;
  terms_accepted_at: string | null;
  accepted_agreement_snapshot: string | null;
  booking_received_email_sent_at: string | null;
  confirmation_email_sent_at: string | null;
  products: BookingProductEmbed | null;
};

export type LogisticsItem = {
  id: string;
  bookingId: string;
  maskin: string;
  kund: string;
  adress: string;
  telefon: string;
  timeLabel: string;
  urgency: "akut" | "kommande";
};

function parseNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePaymentStatus(value: unknown): BookingPaymentStatus {
  if (
    typeof value === "string" &&
    (BOOKING_PAYMENT_STATUSES as readonly string[]).includes(value)
  ) {
    return value as BookingPaymentStatus;
  }
  return "pending";
}

function parseProductEmbed(value: unknown): BookingProductEmbed | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.name !== "string") return null;
  return {
    name: row.name,
    image: typeof row.image === "string" ? row.image : "",
  };
}

export function parseBookingListRow(value: unknown): BookingListRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  if (typeof row.product_id !== "string") return null;
  if (typeof row.customer_name !== "string") return null;
  if (typeof row.customer_email !== "string") return null;
  if (typeof row.customer_phone !== "string") return null;
  if (typeof row.start_date !== "string") return null;
  if (typeof row.end_date !== "string") return null;
  if (typeof row.total_price !== "number") return null;
  if (
    row.status !== "pending" &&
    row.status !== "confirmed" &&
    row.status !== "canceled"
  ) {
    return null;
  }

  const products = parseProductEmbed(row.products);

  return {
    id: row.id,
    product_id: row.product_id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    start_date: row.start_date,
    end_date: row.end_date,
    total_price: row.total_price,
    status: row.status,
    payment_status: parsePaymentStatus(row.payment_status),
    delivery_address: parseNullableString(row.delivery_address),
    org_number: parseNullableString(row.org_number),
    customer_notes: parseNullableString(row.customer_notes),
    terms_accepted_at: parseNullableString(row.terms_accepted_at),
    accepted_agreement_snapshot: parseNullableString(
      row.accepted_agreement_snapshot
    ),
    booking_received_email_sent_at: parseNullableString(
      row.booking_received_email_sent_at
    ),
    confirmation_email_sent_at: parseNullableString(
      row.confirmation_email_sent_at
    ),
    products,
  };
}

export async function fetchBookings(
  client: SupabaseClient
): Promise<BookingListRow[]> {
  const { data, error } = await client
    .from("bookings")
    .select(BOOKINGS_LIST_SELECT)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("bookings: fetch", error.message, error);
    throw new Error(error.message || "Kunde inte hämta bokningar.");
  }

  const rows: BookingListRow[] = [];
  for (const item of data ?? []) {
    const parsed = parseBookingListRow(item);
    if (parsed) rows.push(parsed);
    else console.error("bookings: unexpected row", item);
  }
  return rows;
}

export async function confirmBooking(
  client: SupabaseClient,
  bookingId: string
): Promise<void> {
  const { error } = await client
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (error) {
    console.error("bookings: confirm", error.message, error);
    throw new Error(error.message || "Kunde inte godkänna bokningen.");
  }
}

export function formatBookingDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatBookingPeriod(start: string, end: string): string {
  return `${formatBookingDate(start)} – ${formatBookingDate(end)}`;
}

export function formatTermsAcceptedAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Preliminär",
  confirmed: "Bekräftad",
  canceled: "Avbruten",
};

export const BOOKING_STATUS_BADGE: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-100 text-red-800",
};

export const PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  pending: "Avvaktar betalning",
  requires_capture: "Belopp reserverat",
  succeeded: "Betald",
  canceled: "Avbruten",
  refunded: "Återbetald",
};

export const PAYMENT_STATUS_BADGE: Record<BookingPaymentStatus, string> = {
  pending: "bg-slate-200 text-slate-700",
  requires_capture: "bg-amber-100 text-amber-900",
  succeeded: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-100 text-red-800",
  refunded: "bg-red-100 text-red-800",
};

export function filterConfirmedBookings(
  bookings: BookingListRow[]
): BookingListRow[] {
  return bookings.filter((b) => b.status === "confirmed");
}

export function bookingDisplayAddress(booking: BookingListRow): string {
  return booking.delivery_address?.trim() || "—";
}

export function bookingToLogisticsItem(
  booking: BookingListRow,
  kind: "leverans" | "upphämtning"
): LogisticsItem {
  return {
    id: `${kind}-${booking.id}`,
    bookingId: booking.id,
    maskin: booking.products?.name ?? booking.product_id,
    kund: booking.customer_name,
    adress: bookingDisplayAddress(booking),
    telefon: booking.customer_phone,
    timeLabel: kind === "leverans" ? "Leverans idag" : "Upphämtning idag",
    urgency: "kommande",
  };
}

/** Bekräftade leveranser med start_date = today, sorterade tidigast först. */
export function getTodayDeliveries(
  bookings: BookingListRow[],
  today: string
): LogisticsItem[] {
  return filterConfirmedBookings(bookings)
    .filter((b) => b.start_date === today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .map((b) => bookingToLogisticsItem(b, "leverans"));
}

/** Bekräftade upphämtningar med end_date = today. */
export function getTodayPickups(
  bookings: BookingListRow[],
  today: string
): LogisticsItem[] {
  return filterConfirmedBookings(bookings)
    .filter((b) => b.end_date === today)
    .sort((a, b) => a.end_date.localeCompare(b.end_date))
    .map((b) => bookingToLogisticsItem(b, "upphämtning"));
}

export function pickNextConfirmedEvent(
  bookings: BookingListRow[],
  today: string
): { type: "leverans" | "hämtning"; booking: BookingListRow } | null {
  const confirmed = filterConfirmedBookings(bookings);
  const upcomingDeliveries = confirmed
    .filter((b) => b.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const upcomingPickups = confirmed
    .filter((b) => b.end_date >= today)
    .sort((a, b) => a.end_date.localeCompare(b.end_date));

  const nextDelivery = upcomingDeliveries[0];
  const nextPickup = upcomingPickups[0];

  if (!nextDelivery && !nextPickup) return null;
  if (!nextDelivery) {
    return { type: "hämtning", booking: nextPickup };
  }
  if (!nextPickup) {
    return { type: "leverans", booking: nextDelivery };
  }
  if (nextDelivery.start_date <= nextPickup.end_date) {
    return { type: "leverans", booking: nextDelivery };
  }
  return { type: "hämtning", booking: nextPickup };
}
