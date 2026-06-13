import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminUserOption = {
  id: string;
  email: string;
  displayName: string;
};

function parseAdminUserRow(value: unknown): AdminUserOption | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  if (typeof row.email !== "string") return null;
  const displayName =
    typeof row.display_name === "string" && row.display_name.trim()
      ? row.display_name.trim()
      : row.email.split("@")[0] ?? row.email;
  return { id: row.id, email: row.email, displayName };
}

/**
 * Lists all CMS admins (id, email, display name) for calendar switching.
 */
export async function fetchAdminUsers(
  client: SupabaseClient
): Promise<AdminUserOption[]> {
  const { data, error } = await client.rpc("list_admin_users");

  if (error) {
    console.error("admin-users: list_admin_users", error.message, error);
    throw new Error(error.message || "Kunde inte hämta admin-lista.");
  }

  const admins: AdminUserOption[] = [];
  for (const item of data ?? []) {
    const parsed = parseAdminUserRow(item);
    if (parsed) admins.push(parsed);
    else console.error("admin-users: unexpected row", item);
  }
  return admins;
}
