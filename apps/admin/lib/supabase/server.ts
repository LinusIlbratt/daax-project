import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./env";

/**
 * Server Components, Server Actions, Route Handlers: cookie-backed session (Next.js App Router).
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const cfg = getSupabasePublicConfig();
  if ("error" in cfg) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for the admin app."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (e) {
          console.error("supabase:server:setAll", e);
          // Middleware keeps sessions fresh; Server Components may be static — ignore set failures.
        }
      },
    },
  });
}
