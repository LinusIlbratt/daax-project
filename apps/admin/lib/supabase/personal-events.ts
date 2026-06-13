import type { SupabaseClient } from "@supabase/supabase-js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const PERSONAL_EVENT_COLUMNS =
  "id, user_id, event_date, title, time_text" as const;

export type PersonalEventRow = {
  id: string;
  userId: string;
  date: string;
  title: string;
  time?: string;
};

type PersonalEventDbRow = {
  id: string;
  user_id: string;
  event_date: string;
  title: string;
  time_text: string | null;
};

function parsePersonalEventRow(value: unknown): PersonalEventRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as PersonalEventDbRow;
  if (typeof row.id !== "string") return null;
  if (typeof row.user_id !== "string") return null;
  if (typeof row.event_date !== "string" || !DATE_RE.test(row.event_date)) return null;
  if (typeof row.title !== "string") return null;
  const time =
    typeof row.time_text === "string" && row.time_text.trim()
      ? row.time_text.trim()
      : undefined;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.event_date,
    title: row.title,
    time,
  };
}

export async function fetchPersonalEvents(
  client: SupabaseClient,
  userId: string
): Promise<PersonalEventRow[]> {
  const { data, error } = await client
    .from("personal_events")
    .select(PERSONAL_EVENT_COLUMNS)
    .eq("user_id", userId)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("personal-events: fetch", error.message, error);
    throw new Error(error.message || "Kunde inte hämta händelser.");
  }

  const rows: PersonalEventRow[] = [];
  for (const item of data ?? []) {
    const parsed = parsePersonalEventRow(item);
    if (parsed) rows.push(parsed);
    else console.error("personal-events: unexpected row", item);
  }
  return rows;
}

export async function insertPersonalEvent(
  client: SupabaseClient,
  userId: string,
  input: { date: string; title: string; time?: string }
): Promise<PersonalEventRow> {
  if (!DATE_RE.test(input.date)) {
    throw new Error("Ogiltigt datumformat (YYYY-MM-DD).");
  }
  const title = input.title.trim();
  if (!title) {
    throw new Error("Titel krävs.");
  }

  const { data, error } = await client
    .from("personal_events")
    .insert({
      user_id: userId,
      event_date: input.date,
      title,
      time_text: input.time?.trim() || null,
    })
    .select(PERSONAL_EVENT_COLUMNS)
    .single();

  if (error) {
    console.error("personal-events: insert", error.message, error);
    throw new Error(error.message || "Kunde inte spara händelsen.");
  }

  const parsed = parsePersonalEventRow(data);
  if (!parsed) {
    throw new Error("Kunde inte läsa sparad händelse.");
  }
  return parsed;
}

export async function updatePersonalEvent(
  client: SupabaseClient,
  eventId: string,
  input: { title: string; time?: string }
): Promise<PersonalEventRow> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Titel krävs.");
  }

  const { data, error } = await client
    .from("personal_events")
    .update({
      title,
      time_text: input.time?.trim() || null,
    })
    .eq("id", eventId)
    .select(PERSONAL_EVENT_COLUMNS)
    .single();

  if (error) {
    console.error("personal-events: update", error.message, error);
    throw new Error(error.message || "Kunde inte uppdatera händelsen.");
  }

  const parsed = parsePersonalEventRow(data);
  if (!parsed) {
    throw new Error("Kunde inte läsa uppdaterad händelse.");
  }
  return parsed;
}

export async function deletePersonalEvent(
  client: SupabaseClient,
  eventId: string
): Promise<void> {
  const { error } = await client.from("personal_events").delete().eq("id", eventId);

  if (error) {
    console.error("personal-events: delete", error.message, error);
    throw new Error(error.message || "Kunde inte ta bort händelsen.");
  }
}
