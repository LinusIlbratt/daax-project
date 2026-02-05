import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Varumärke */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="font-montserrat text-2xl font-extrabold text-white"
            >
              DaaX
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              Uthyrning av maskiner och event. Baserat i Uddevalla – leverans i
              Uddevalla och närliggande områden.
            </p>
          </div>

          {/* Länkar */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sidor
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm transition hover:text-white">
                  Startsida
                </Link>
              </li>
              <li>
                <Link
                  href="/maskiner"
                  className="text-sm transition hover:text-white"
                >
                  Maskiner
                </Link>
              </li>
              <li>
                <Link
                  href="/bastu"
                  className="text-sm transition hover:text-white"
                >
                  Bastu & Event
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Kontakt
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:info@daax.se"
                  className="transition hover:text-white"
                >
                  info@daax.se
                </a>
              </li>
              <li>
                <a
                  href="tel:+46701234567"
                  className="transition hover:text-white"
                >
                  070-123 45 67
                </a>
              </li>
              <li className="text-slate-400">
                Skeppsbron 1<br />
                451 00 Uddevalla
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} DaaX Rental. Alla rättigheter
            förbehållna.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/maskiner" className="transition hover:text-slate-300">
              Maskiner
            </Link>
            <Link href="/bastu" className="transition hover:text-slate-300">
              Bastu
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
