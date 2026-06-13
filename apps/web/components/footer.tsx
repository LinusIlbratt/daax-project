import Link from "next/link";
import { siteContent } from "@/theme/site-content";

export function Footer() {
  const { brand, contact, footer, nav } = siteContent;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-footer text-brand-text-inverse">
      <div className="theme-container py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Link href="/" className="text-lg font-semibold text-white">
              {brand.name}
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              {footer.tagline}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Navigation
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-300 transition hover:text-white"
                >
                  Startsida
                </Link>
              </li>
              <li>
                <Link
                  href={nav.catalogHref}
                  className="text-slate-300 transition hover:text-white"
                >
                  {nav.catalogLabel}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Kontakt
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li>
                <a href={`mailto:${contact.email}`} className="transition hover:text-white">
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={`tel:${contact.phoneHref}`} className="transition hover:text-white">
                  {contact.phone}
                </a>
              </li>
              <li>
                {contact.addressLines.map((line) => (
                  <span key={line} className="block text-slate-400">
                    {line}
                  </span>
                ))}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>
            © {year} {brand.legalName}. Alla rättigheter förbehållna.
          </p>
          <Link href={nav.catalogHref} className="text-slate-400 transition hover:text-white">
            {footer.bookCta}
          </Link>
        </div>
      </div>
    </footer>
  );
}
