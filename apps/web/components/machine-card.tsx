import Link from "next/link";

export function MachineCard({
  slug,
  name,
  pricePerDay,
  description,
}: {
  slug: string;
  name: string;
  pricePerDay: number;
  description: string;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div
        className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200"
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-2">
          {description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <p className="font-semibold text-slate-900">
            fr {pricePerDay.toLocaleString("sv-SE")} kr/dygn
          </p>
          <Link
            href={`/produkt/${slug}`}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Hyr
          </Link>
        </div>
      </div>
    </article>
  );
}
