export const DISCOUNT_DAYS_THRESHOLD = 3;
export const DISCOUNT_PERCENT = 15;

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000))) + 1;
}

export function calculateTotal(
  pricePerDay: number,
  startDate: string,
  endDate: string
): { days: number; total: number; hasDiscount: boolean } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = daysBetween(start, end);
  const subtotal = days * pricePerDay;
  const hasDiscount = days > DISCOUNT_DAYS_THRESHOLD;
  const discount = hasDiscount ? subtotal * (DISCOUNT_PERCENT / 100) : 0;
  const total = subtotal - discount;
  return { days, total, hasDiscount };
}

export type Product = {
  name: string;
  pricePerDay: number;
  description: string;
  info?: string;
};

export const PRODUCTS: Record<string, Product> = {
  minigravare: {
    name: "Minigrävare",
    pricePerDay: 1500,
    description:
      "Kompakt minigrävare för grävning, schakt och trädgårdsarbete. Lättmanövrerad och lämplig för trånga utrymmen. Levereras med bränsle och grundinstruktion.",
    info: undefined,
  },
  dumper: {
    name: "Hjuldumper Batteri",
    pricePerDay: 900,
    description:
      "Tyst och miljövänlig batteridriven hjuldumper. Perfekt för inomhus eller känsliga områden. Lastkapacitet upp till 500 kg.",
    info: undefined,
  },
  markvibrator: {
    name: "Hjuldumper med svängdörr",
    pricePerDay: 600,
    description:
      "Effektiv och lämplig för mindre projekt och trädgårdsarbeten.",
    info: undefined,
  },
  kompaktor: {
    name: "Annan maskin",
    pricePerDay: 750,
    description: "Robust och enkel att hantera vid schakt och omläggning.",
    info: undefined,
  },
  bastuvagn: {
    name: "Mobil Bastuvagn",
    pricePerDay: 900,
    description:
      "Lyxig mobil bastu på släp. Enkel att köra till plats, snabb uppvärmning. Perfekt för event, trädgårdsfest eller firma.",
    info: "Plats för 6 pers",
  },
  badtunna: {
    name: "Badtunna",
    pricePerDay: 1200,
    description: "Träbadtunna för utomhus. Perfekt för event och avkoppling.",
    info: undefined,
  },
};

/** Produkter som kräver leveransadress (utkörning). */
export const PRODUCTS_REQUIRING_DELIVERY = ["bastuvagn", "badtunna"];

export function requiresDeliveryAddress(slug: string): boolean {
  return PRODUCTS_REQUIRING_DELIVERY.includes(slug);
}
