"use client";

import Link from "next/link";
import { siteContent } from "@/theme/site-content";

export function Header() {
  const { brand, nav } = siteContent;

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border/80 bg-brand-surface/90 shadow-[var(--theme-shadow-header)] backdrop-blur-md">
      <div className="theme-container flex h-[var(--theme-header-height)] items-center justify-between gap-4">
        <Link href="/" className="group min-w-0">
          <span className="block truncate text-[15px] font-semibold tracking-tight text-brand-text transition group-hover:text-brand-accent sm:text-base">
            {brand.name}
          </span>
          <span className="hidden text-[11px] text-brand-text-subtle sm:block">
            {brand.taglineShort}
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-3" aria-label="Huvudnavigation">
          <Link href={nav.catalogHref} className="theme-link hidden text-sm sm:inline">
            {nav.catalogLabel}
          </Link>
          <Link href={nav.catalogHref} className="theme-btn-primary px-4 py-2 text-sm">
            {nav.bookCta}
          </Link>
        </nav>
      </div>
    </header>
  );
}
