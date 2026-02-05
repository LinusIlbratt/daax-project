import Link from "next/link";

export const metadata = {
  title: "DaaX Rental - Maskiner & Event",
  description: "Boka enkelt och smidigt",
};

export default function Home() {
  return (
    <main className="relative h-screen overflow-hidden">
      <div className="grid h-full grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
        {/* Vänster: Maskiner (50% bredd desktop, 50% höjd mobil) */}
        <Link
          href="/maskiner"
          className="group relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 px-8 py-16 text-white transition hover:from-slate-700 hover:via-slate-600"
        >
          <div
            className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-80"
            aria-hidden
          />
          <h2 className="relative text-4xl font-bold tracking-widest text-white sm:text-5xl md:text-6xl">
            MASKINER
          </h2>
          <span className="relative mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-amber-400 px-6 py-3 font-semibold text-amber-400 transition group-hover:bg-amber-400 group-hover:text-slate-900">
            Gå till Entreprenad
          </span>
        </Link>

        {/* Höger: Bastu (50% bredd desktop, 50% höjd mobil) */}
        <Link
          href="/bastu"
          className="group relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-800 px-8 py-16 text-white transition hover:from-teal-600 hover:via-teal-500"
        >
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_70%_80%,rgba(255,255,255,0.1),transparent)]"
            aria-hidden
          />
          <h2 className="relative text-4xl font-bold tracking-widest text-white sm:text-5xl md:text-6xl">
            BASTU & EVENT
          </h2>
          <span className="relative mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-white px-6 py-3 font-semibold text-white transition group-hover:bg-white group-hover:text-teal-700">
            Gå till Event
          </span>
        </Link>
      </div>

      {/* DaaX-branding overlay – högt upp, pointer-events-none så att klick når länkarna under */}
      <div
        className="absolute inset-0 z-50 flex flex-col items-center justify-start px-4 pt-[14vh] sm:pt-[16vh] pointer-events-none"
        aria-hidden
      >
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-center">
          <span className="font-montserrat text-sm font-bold uppercase tracking-[0.2em] text-slate-300/95 md:text-base">
            ATT JOBBA
          </span>
          <span className="text-slate-400" aria-hidden>
            •
          </span>
          <div className="flex flex-col items-center justify-center">
            <h1
              className="font-montserrat text-6xl font-extrabold tracking-tight text-white drop-shadow-xl sm:text-7xl md:text-8xl"
              style={{
                textShadow:
                  "0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(0,0,0,0.2)",
              }}
            >
              DaaX
            </h1>
            <span
              className="mt-1 font-montserrat text-xl font-medium tracking-[0.25em] text-white/90 sm:text-2xl md:text-3xl md:tracking-[0.3em]"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
            >
              rental
            </span>
          </div>
          <span className="text-slate-400" aria-hidden>
            •
          </span>
          <span className="font-montserrat text-sm font-bold uppercase tracking-[0.2em] text-amber-400/95 md:text-base">
            ATT NJUTA
          </span>
        </div>
      </div>
    </main>
  );
}
