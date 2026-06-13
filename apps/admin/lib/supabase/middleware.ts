import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "./env";
import { userHasAdminRole } from "./user-roles";

const LOGIN_PATH = "/login";

async function redirectUnauthorized(
  request: NextRequest,
  supabase: SupabaseClient,
  response: NextResponse
): Promise<NextResponse> {
  await supabase.auth.signOut();
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set("error", "unauthorized");
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}

async function ensureAdminUser(
  supabase: SupabaseClient,
  user: User,
  request: NextRequest,
  supabaseResponse: NextResponse
): Promise<NextResponse | null> {
  try {
    const isAdmin = await userHasAdminRole(supabase, user.id);
    if (isAdmin) {
      return null;
    }
  } catch (e) {
    console.error("supabase:middleware: userHasAdminRole", e);
  }
  return redirectUnauthorized(request, supabase, supabaseResponse);
}

function isPublicAssetPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname);
}

/**
 * Refreshes the Auth session and returns a response that carries updated cookies.
 * Redirects unauthenticated users away from protected routes (except /login and static assets).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (isPublicAssetPath(pathname)) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const cfg = getSupabasePublicConfig();
  if ("error" in cfg) {
    console.error("supabase:middleware: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
      return NextResponse.next({ request: { headers: request.headers } });
    }
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("error", "config");
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("supabase:middleware:getUser", userError.message, userError);
  }

  const onLoginRoute = pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);

  if (!user && !onLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.delete("error");
    return NextResponse.redirect(url);
  }

  if (user) {
    const denied = await ensureAdminUser(
      supabase,
      user,
      request,
      supabaseResponse
    );
    if (denied) {
      return denied;
    }

    if (onLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.delete("error");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
