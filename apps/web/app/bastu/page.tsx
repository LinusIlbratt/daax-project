import Link from "next/link";
import Image from "next/image";
import { getProductsByCategory } from "@/lib/products-data";
import type { ProductData } from "@/lib/products-data";

/* Ikoner för bastu-egenskaper */
function IconFlame({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconTruck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 14.52 8H14" />
      <path d="M19 18h2v-4h-3" />
      <path d="M2 14h3" />
    </svg>
  );
}
function IconTimer({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function buildBastuFeatures(product: ProductData): {
  label: string;
  icon: "flame" | "users" | "truck" | "timer";
}[] {
  const features: { label: string; icon: "flame" | "users" | "truck" | "timer" }[] = [];
  if (product.info?.trim()) {
    features.push({ label: product.info.trim(), icon: "users" });
  }
  features.push({ label: "Vedeldad", icon: "flame" });
  if (product.requiresDelivery) {
    features.push({ label: "Levereras på släp", icon: "truck" });
  }
  features.push({ label: "Snabb uppvärmning", icon: "timer" });
  return features;
}

function BastuCard({
  product,
  cardOnLeft,
}: {
  product: ProductData;
  cardOnLeft: boolean;
}) {
  const features = buildBastuFeatures(product);
  const iconClass = "h-5 w-5 shrink-0 text-amber-400";
  const imageSrc = product.image || "";

  return (
    <article className="relative flex flex-col overflow-visible rounded-2xl">
      <div className="relative min-h-[400px] overflow-hidden rounded-t-2xl md:min-h-[500px]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-700/80" aria-hidden />
        )}
      </div>

      <div
        className={`relative z-10 -mt-20 flex justify-center px-4 pb-4 md:-mt-28 md:px-0 md:pb-0 ${
          cardOnLeft ? "md:justify-start" : "md:justify-end"
        }`}
      >
        <div
          className={`flex w-full max-w-full flex-col rounded-2xl border border-white/15 bg-slate-800/95 p-6 shadow-xl md:w-[420px] md:py-6 ${
            cardOnLeft
              ? "md:-translate-x-6 md:rounded-r-2xl md:pr-8"
              : "md:translate-x-6 md:rounded-l-2xl md:pl-8"
          }`}
        >
          <h3 className="font-playfair text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {product.name}
          </h3>
          <p className="mt-2 text-lg font-semibold text-amber-400">
            fr {product.pricePerDay.toLocaleString("sv-SE")} kr/dygn
          </p>
          <p className="mt-4 text-amber-50/95 leading-relaxed">
            {product.description}
          </p>
          {features.length > 0 && (
            <ul className="mt-6 space-y-3" aria-label="Egenskaper">
              {features.map((f) => (
                <li key={f.label} className="flex items-center gap-3">
                  {f.icon === "flame" && <IconFlame className={iconClass} />}
                  {f.icon === "users" && <IconUsers className={iconClass} />}
                  {f.icon === "truck" && <IconTruck className={iconClass} />}
                  {f.icon === "timer" && <IconTimer className={iconClass} />}
                  <span className="text-amber-50">{f.label}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/bastu/boka?slug=${encodeURIComponent(product.slug)}`}
            className="mt-6 block w-full rounded-xl bg-amber-600 py-4 text-center text-lg font-semibold text-white transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Boka
          </Link>
        </div>
      </div>
    </article>
  );
}

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Välj helg",
    text: "Välj vilken helg (fredag–söndag) du vill ha bastun. Boka en dag eller hela helgen – det bestämmer du.",
  },
  {
    step: 2,
    title: "Boka och betala",
    text: "Fyll i dina uppgifter och betala med Swish eller kort. Du får bekräftelse direkt. Leveransadress och kontaktuppgifter – klart.",
  },
  {
    step: 3,
    title: "Vi levererar – ni njuter – vi hämtar",
    text: "Vi kör bastun på släp till dig, sätter upp och ger kort instruktion. Efter helgen hämtar vi. Du behöver bara njuta.",
  },
];

export default async function BastuPage() {
  const eventProducts = await getProductsByCategory("event");

  return (
    <main className="min-h-screen bg-slate-900">
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-24 sm:px-8">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          aria-hidden
        >
          <source src="/videos/bastu-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-[5] bg-black/75" aria-hidden />
        <div className="relative z-10 mx-auto max-w-3xl text-center outline-none ring-0">
          <h1
            className="font-playfair text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
          >
            Din egen oas, levererad.
          </h1>
          <p
            className="mt-6 text-lg text-white/95 sm:text-xl md:text-2xl"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
          >
            Skapa minnen i helgen med vår vedeldade premium-bastu.
          </p>
        </div>
      </section>

      <section className="border-t border-slate-700/50 px-6 py-16 sm:px-8 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-playfair text-2xl font-semibold tracking-tight text-amber-50 sm:text-3xl">
            Så funkar det
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3 md:gap-12">
            {HOW_IT_WORKS.map(({ step, title, text }) => (
              <div key={step} className="relative text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500/50 bg-amber-600/20 text-lg font-bold text-amber-50">
                  {step}
                </span>
                <h3 className="mt-4 font-playfair text-lg font-semibold text-amber-50">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 font-playfair text-2xl font-semibold tracking-tight text-amber-50 sm:text-3xl">
            Våra bastu- och eventobjekt
          </h2>
          {eventProducts.length === 0 ? (
            <p className="text-amber-100/80">Inga objekt att visa just nu.</p>
          ) : (
            <div className="flex flex-col gap-14">
              {eventProducts.map((product, index) => (
                <BastuCard
                  key={product.slug}
                  product={product}
                  cardOnLeft={index % 2 === 1}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-700/50 px-6 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-playfair text-2xl font-semibold tracking-tight text-amber-50 sm:text-3xl">
            Perfekt till
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {[
              "Trädgårdsfest",
              "Födelsedag",
              "Avkoppling med vänner",
              "Helg med familjen",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border-2 border-amber-500/40 bg-amber-500/15 px-7 py-3.5 text-base font-semibold text-amber-50 sm:text-lg"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Ved ingår",
                text: "Tillräckligt med ved för helgen. Du behöver inte tänka på något.",
              },
              {
                title: "Instruktion vid leverans",
                text: "Vi sätter upp och visar hur du kör bastun. Enkelt och säkert.",
              },
              {
                title: "Leverans & hämtning",
                text: "Vi kör till dig och hämtar när helgen är över. Du bara njuter.",
              },
            ].map(({ title, text }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-slate-800/60 px-5 py-4 backdrop-blur-sm"
              >
                <h3 className="font-semibold text-amber-50">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
                  {text}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-amber-100/70">
            Vi levererar i Uddevalla och närliggande områden. Frågor? Ring oss
            på{" "}
            <a
              href="tel:+46701234567"
              className="font-medium text-amber-300 underline decoration-amber-500/50 hover:text-amber-200"
            >
              070-123 45 67
            </a>{" "}
            eller skicka e-post till{" "}
            <a
              href="mailto:info@daax.se"
              className="font-medium text-amber-300 underline decoration-amber-500/50 hover:text-amber-200"
            >
              info@daax.se
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
