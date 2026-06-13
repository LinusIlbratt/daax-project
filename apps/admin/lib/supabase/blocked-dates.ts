import type { SupabaseClient } from "@supabase/supabase-js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const BLOCKED_DATES_COLUMNS = "id, date, reason" as const;

export type BlockedDateRow = {
  id: string;
  date: string;
  reason: string;
};

export function isBlockedDateString(value: string): boolean {
  return DATE_RE.test(value);
}

export function parseBlockedDateRow(value: unknown): BlockedDateRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  if (typeof row.date !== "string" || !isBlockedDateString(row.date)) return null;
  if (typeof row.reason !== "string") return null;
  return { id: row.id, date: row.date, reason: row.reason };
}

export async function fetchBlockedDates(
  client: SupabaseClient
): Promise<BlockedDateRow[]> {
  const { data, error } = await client
    .from("blocked_dates")
    .select(BLOCKED_DATES_COLUMNS)
    .order("date", { ascending: true });

  if (error) {
    console.error("blocked-dates: fetch", error.message, error);
    throw new Error(error.message || "Kunde inte hämta blockerade datum.");
  }

  const rows: BlockedDateRow[] = [];
  for (const item of data ?? []) {
    const parsed = parseBlockedDateRow(item);
    if (parsed) rows.push(parsed);
    else console.error("blocked-dates: unexpected row", item);
  }
  return rows;
}

export async function insertBlockedDate(
  client: SupabaseClient,
  date: string,
  reason = ""
): Promise<void> {
  if (!isBlockedDateString(date)) {
    throw new Error("Ogiltigt datumformat (YYYY-MM-DD).");
  }

  const { error } = await client.from("blocked_dates").insert({
    date,
    reason: reason.trim(),
  });

  if (error) {
    console.error("blocked-dates: insert", error.message, error);
    if (error.code === "23505") {
      throw new Error("Datumet är redan blockerat.");
    }
    throw new Error(error.message || "Kunde inte blockera datumet.");
  }
}

export async function deleteBlockedDateByDate(
  client: SupabaseClient,
  date: string
): Promise<void> {
  if (!isBlockedDateString(date)) {
    throw new Error("Ogiltigt datumformat (YYYY-MM-DD).");
  }

  const { error } = await client.from("blocked_dates").delete().eq("date", date);

  if (error) {
    console.error("blocked-dates: delete", error.message, error);
    throw new Error(error.message || "Kunde inte ta bort blockeringen.");
  }
}
