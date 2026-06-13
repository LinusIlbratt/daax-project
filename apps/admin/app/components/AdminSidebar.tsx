"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Package,
  Settings,
  ChevronRight,
} from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { countPendingBookings, fetchBookings } from "@/lib/supabase/bookings";
import { useMobileMenu } from "./AdminShell";

const SIDEBAR_LINKS = [
  { href: "/", label: "Översikt", icon: LayoutDashboard, showPending: false },
  { href: "/bookings", label: "Bokningar", icon: CalendarDays, showPending: true },
  { href: "/calendar", label: "Kalender", icon: CalendarRange, showPending: false },
  { href: "/inventory", label: "Hyrobjekt", icon: Package, showPending: false },
  { href: "/settings", label: "Inställningar", icon: Settings, showPending: false },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const basePath = pathname?.split("/").filter(Boolean)[0] ?? "";
  const current = basePath ? `/${basePath}` : "/";
  const { mobileOpen, setMobileOpen } = useMobileMenu();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const rows = await fetchBookings(supabase);
        if (!cancelled) setPendingCount(countPendingBookings(rows));
      } catch (e) {
        console.error("sidebar: pending count", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-[rgb(var(--admin-sidebar))] text-slate-200 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--admin-sidebar-active))] text-white">
          <LayoutDashboard className="h-5 w-5" aria-hidden />
        </div>
        <span className="font-semibold tracking-tight text-white">Forshälla</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Huvudmeny">
        {SIDEBAR_LINKS.map(({ href, label, icon: Icon, showPending }) => {
          const isActive = current === href;
          const badge = showPending && pendingCount > 0 ? pendingCount : null;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              <span className="flex-1">{label}</span>
              {badge !== null ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-amber-950">
                  {badge}
                </span>
              ) : null}
              {isActive && (
                <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="px-3 py-2 text-xs text-slate-500">Forshälla Alltjänst</p>
      </div>
    </aside>
    </>
  );
}
