import Link from "next/link";

export function LandingProductCard({
  slug,
  name,
  pricePerDay,
  info,
}: {
  slug: string;
  name: string;
  pricePerDay: number;
  info: string | null;
}) {
  return (
    <Link
      href={`/produkt/${slug}`}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-400 hover:shadow-md"
    >
      <div className="aspect-[4/3] bg-slate-200" aria-hidden />
      <div className="p-4">
        <h3 className="font-semibold text-slate-900">{name}</h3>
        {info && <p className="mt-1 text-sm text-slate-600">{info}</p>}
        <p className="mt-2 font-semibold text-amber-700">
          fr {pricePerDay.toLocaleString("sv-SE")} kr/dygn
        </p>
      </div>
    </Link>
  );
}
