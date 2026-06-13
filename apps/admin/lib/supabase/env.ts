export type SupabasePublicConfig =
  | { url: string; anonKey: string }
  | { error: "missing_env" };

/**
 * Public Supabase URL + anon key (browser + server + middleware).
 */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return { error: "missing_env" };
  }
  return { url, anonKey };
}
