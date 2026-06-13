import type { SupabaseClient } from "@supabase/supabase-js";
import { isUserRole, type UserRole } from "@booking-system/types";

export const USER_ROLE_COLUMNS = "role" as const;

/**
 * Returns the app role for an auth user, or null if no row / unknown role.
 */
export async function getUserRole(
  client: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const { data, error } = await client
    .from("user_roles")
    .select(USER_ROLE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("user-roles: getUserRole", error.message, error);
    throw new Error(error.message || "Kunde inte hämta användarroll.");
  }

  const role = data?.role;
  if (typeof role === "string" && isUserRole(role)) {
    return role;
  }
  return null;
}

/**
 * Server-side: role for the currently authenticated user (cookie session).
 */
export async function getCurrentUserRole(
  client: SupabaseClient
): Promise<{ userId: string; role: UserRole | null } | null> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError) {
    console.error("user-roles: getCurrentUserRole auth", authError.message, authError);
    throw new Error(authError.message || "Kunde inte verifiera session.");
  }

  if (!user) {
    return null;
  }

  const role = await getUserRole(client, user.id);
  return { userId: user.id, role };
}

export async function userHasAdminRole(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(client, userId);
  return role === "ADMIN";
}
