import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./env";

let browserClient: SupabaseClient | undefined;

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabasePublicConfig();
  return "url" in cfg;
}

/**
 * Browser Supabase client: anon key + session persisted in cookies (aligned with `@supabase/ssr` + middleware).
 * Returns a shared instance in the browser to avoid multiple GoTrue clients.
 * On the server, returns a new instance per call (no cross-request singleton).
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  const cfg = getSupabasePublicConfig();
  if ("error" in cfg) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for the admin app."
    );
  }
  if (typeof window === "undefined") {
    return createBrowserClient(cfg.url, cfg.anonKey);
  }
  if (!browserClient) {
    browserClient = createBrowserClient(cfg.url, cfg.anonKey);
  }
  return browserClient;
}
