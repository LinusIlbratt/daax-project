"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";
  const isMaskiner = pathname.startsWith("/maskiner");
  const isBastu = pathname.startsWith("/bastu");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-semibold text-slate-900 transition hover:text-amber-600"
        >
          Uthyrning
        </Link>

        {isHome ? (
          <div className="h-5 w-20" aria-hidden />
        ) : (
          <nav
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
            aria-label="Välj affärsområde"
          >
            <Link
              href="/maskiner"
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                isMaskiner
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="mr-1.5" aria-hidden>
                🚜
              </span>
              Maskiner
            </Link>
            <Link
              href="/bastu"
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                isBastu
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="mr-1.5" aria-hidden>
                🧖
              </span>
              Bastu
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
