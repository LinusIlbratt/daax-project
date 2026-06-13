import type { SupabaseClient } from "@supabase/supabase-js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const BLOCKED_DATES_LIST_COLUMNS = "date" as const;

export function isBlockedDateString(value: string): boolean {
  return DATE_RE.test(value);
}

/** Normalized YYYY-MM-DD strings from `blocked_dates`, sorted ascending. */
export async function listBlockedDateStrings(
  supabase: SupabaseClient,
  options?: { from?: string; to?: string }
): Promise<string[]> {
  let query = supabase
    .from("blocked_dates")
    .select(BLOCKED_DATES_LIST_COLUMNS)
    .order("date", { ascending: true });

  if (options?.from && isBlockedDateString(options.from)) {
    query = query.gte("date", options.from);
  }
  if (options?.to && isBlockedDateString(options.to)) {
    query = query.lte("date", options.to);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const dates: string[] = [];
  for (const row of data ?? []) {
    const raw = row as { date: string | null };
    if (typeof raw.date === "string" && isBlockedDateString(raw.date)) {
      dates.push(raw.date);
    }
  }
  return dates;
}
