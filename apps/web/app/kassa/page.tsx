import { redirect } from "next/navigation";

export default async function KassaRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const product =
    (typeof params.product === "string" ? params.product : null) ??
    (typeof params.slug === "string" ? params.slug : null);

  if (!product) {
    redirect("/");
  }

  const next = new URLSearchParams();
  if (typeof params.start === "string") next.set("start", params.start);
  if (typeof params.end === "string") next.set("end", params.end);
  if (typeof params.payment_return === "string") {
    next.set("payment_return", params.payment_return);
  }
  if (typeof params.redirect_status === "string") {
    next.set("redirect_status", params.redirect_status);
  }

  const qs = next.toString();
  redirect(qs ? `/boka/${encodeURIComponent(product)}?${qs}` : `/boka/${encodeURIComponent(product)}`);
}
