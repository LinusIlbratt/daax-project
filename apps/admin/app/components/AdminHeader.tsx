"use client";

import { useState } from "react";
import { User, Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMobileMenu } from "./AdminShell";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AdminHeaderProps = {
  userEmail: string;
};

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const { toggle } = useMobileMenu();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const displayEmail = userEmail.trim() || "—";

  async function handleLogout() {
    setLogoutError(null);
    if (!isSupabaseConfigured()) {
      setLogoutError("Supabase är inte konfigurerat.");
      return;
    }
    setLoggingOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("admin header: signOut", error.message, error);
        setLogoutError(error.message || "Utloggning misslyckades.");
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("admin header: signOut", e);
      setLogoutError(e instanceof Error ? e.message : "Utloggning misslyckades.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] px-4 shadow-admin sm:px-6">
      <button
        type="button"
        onClick={toggle}
        className="rounded-xl p-2 text-[rgb(var(--admin-text-muted))] transition hover:bg-slate-100 hover:text-[rgb(var(--admin-text))] lg:hidden"
        aria-label="Öppna meny"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <div className="flex-1 lg:hidden" />
      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
        {logoutError ? (
          <p role="alert" className="max-w-xs text-right text-xs text-[rgb(var(--admin-error))]">
            {logoutError}
          </p>
        ) : null}
        <div className="flex items-center gap-2 rounded-full bg-slate-100 py-2 pl-3 pr-2 text-sm font-medium text-[rgb(var(--admin-text))] sm:pr-3">
          <User className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <span className="max-w-[12rem] truncate sm:max-w-xs" title={displayEmail}>
            {displayEmail}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgb(var(--admin-border))] bg-white px-2.5 py-1 text-xs font-semibold text-[rgb(var(--admin-text))] transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Logga ut"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            {loggingOut ? "…" : "Logga ut"}
          </button>
        </div>
      </div>
    </header>
  );
}
