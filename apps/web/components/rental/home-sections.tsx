import Link from "next/link";
import { siteContent } from "@/theme/site-content";

export function HomeHero() {
  const { home, brand, nav } = siteContent;

  return (
    <section className="theme-section border-b border-brand-border bg-brand-surface">
      <div className="theme-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="theme-label mb-4">{brand.taglineShort}</p>
          <h1 className="theme-heading-lg text-balance">{home.heroTitle}</h1>
          <p className="theme-body mx-auto mt-5 max-w-xl text-balance">
            {home.heroSubtitle}
          </p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link href={nav.catalogHref} className="theme-btn-primary px-8 py-3">
              {nav.seeCatalog}
            </Link>
            <a
              href={`tel:${siteContent.contact.phoneHref}`}
              className="theme-btn-secondary px-8 py-3"
            >
              Ring oss
            </a>
          </div>
          <ul className="mt-12 grid gap-3 text-left sm:grid-cols-3 sm:gap-4 sm:text-center">
            {home.trustPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 rounded-xl border border-brand-border/80 bg-brand-bg px-4 py-3 text-sm text-brand-text-muted sm:flex-col sm:items-center sm:gap-2 sm:text-center"
              >
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-success sm:mt-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const { home } = siteContent;

  return (
    <section className="theme-section bg-brand-bg">
      <div className="theme-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="theme-heading-md">Så fungerar det</h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">
            {home.howItWorksIntro}
          </p>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {siteContent.howItWorks.map(({ step, title, text }) => (
            <li
              key={step}
              className="theme-card relative p-6 sm:p-7"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-sm font-semibold text-brand-text">
                {step}
              </span>
              <h3 className="mt-5 text-base font-semibold text-brand-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ContactStrip() {
  const { contact, home } = siteContent;

  return (
    <section className="theme-section-tight border-t border-brand-border bg-brand-surface">
      <div className="theme-container">
        <div className="theme-card mx-auto max-w-xl p-8 text-center">
          <p className="theme-body">{home.contactIntro}</p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
            <a href={`tel:${contact.phoneHref}`} className="theme-link">
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`} className="theme-link">
              {contact.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
