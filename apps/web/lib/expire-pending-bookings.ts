import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripeServer } from "@/lib/stripe";

const EXPIRE_SELECT =
  "id, stripe_payment_intent_id, payment_status, created_at" as const;

type ExpireCandidateRow = {
  id: string;
  stripe_payment_intent_id: string | null;
  payment_status: string;
  created_at: string;
};

const DEFAULT_EXPIRY_HOURS = 24;
const MAX_BATCH_SIZE = 50;

function parseExpireCandidate(value: unknown): ExpireCandidateRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  if (typeof row.payment_status !== "string") return null;
  if (typeof row.created_at !== "string") return null;
  if (
    row.stripe_payment_intent_id !== null &&
    typeof row.stripe_payment_intent_id !== "string"
  ) {
    return null;
  }
  return {
    id: row.id,
    stripe_payment_intent_id:
      typeof row.stripe_payment_intent_id === "string"
        ? row.stripe_payment_intent_id
        : null,
    payment_status: row.payment_status,
    created_at: row.created_at,
  };
}

export function getPendingBookingExpiryHours(
  env: NodeJS.ProcessEnv = process.env
): number {
  const raw = env.PENDING_BOOKING_EXPIRY_HOURS?.trim();
  if (!raw) return DEFAULT_EXPIRY_HOURS;
  const hours = Number.parseInt(raw, 10);
  if (!Number.isFinite(hours) || hours < 1 || hours > 168) {
    return DEFAULT_EXPIRY_HOURS;
  }
  return hours;
}

export type ExpirePendingBookingsResult = {
  scanned: number;
  expired: number;
  errors: string[];
};

/**
 * Cancels bookings where checkout was started but payment never completed.
 * Does not touch `requires_capture` (authorized, awaiting admin).
 */
export async function expirePendingBookings(
  supabase: SupabaseClient,
  options?: { expiryHours?: number; limit?: number }
): Promise<ExpirePendingBookingsResult> {
  const expiryHours = options?.expiryHours ?? getPendingBookingExpiryHours();
  const limit = options?.limit ?? MAX_BATCH_SIZE;
  const cutoff = new Date(Date.now() - expiryHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(EXPIRE_SELECT)
    .eq("status", "pending")
    .eq("payment_status", "pending")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("expire-pending-bookings: fetch", error.message, error);
    throw error;
  }

  const rows = (data ?? [])
    .map(parseExpireCandidate)
    .filter((row): row is ExpireCandidateRow => row !== null);

  const stripe = getStripeServer();
  const errors: string[] = [];
  let expired = 0;

  for (const row of rows) {
    if (row.stripe_payment_intent_id && stripe) {
      try {
        await stripe.paymentIntents.cancel(row.stripe_payment_intent_id);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to cancel PaymentIntent";
        console.error(
          "expire-pending-bookings:stripe cancel",
          row.id,
          message,
          e
        );
        errors.push(`${row.id}: ${message}`);
        continue;
      }
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "canceled", payment_status: "canceled" })
      .eq("id", row.id)
      .eq("status", "pending")
      .eq("payment_status", "pending");

    if (updateError) {
      console.error(
        "expire-pending-bookings: update",
        row.id,
        updateError.message,
        updateError
      );
      errors.push(`${row.id}: ${updateError.message}`);
      continue;
    }

    expired += 1;
  }

  return { scanned: rows.length, expired, errors };
}
