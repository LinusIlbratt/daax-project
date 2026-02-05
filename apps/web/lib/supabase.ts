import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side Supabase client (API routes + server components).
 * Use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */
export function getSupabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export type SupabaseProductRow = {
  slug: string;
  name: string;
  price_per_day: number;
  description: string;
  category: "entreprenad" | "event";
  image: string;
  agreement: string;
  info: string | null;
  requires_delivery: boolean;
};
