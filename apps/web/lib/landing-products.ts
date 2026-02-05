export type ProductCategory = "entreprenad" | "event";

export type LandingProduct = {
  id: string;
  slug: string;
  name: string;
  pricePerDay: number;
  info: string | null;
  category: ProductCategory;
};

export const MOCK_PRODUCTS: LandingProduct[] = [
  {
    id: "minigravare",
    slug: "minigravare",
    name: "Minigrävare 1.8 ton",
    pricePerDay: 1500,
    info: null,
    category: "entreprenad",
  },
  {
    id: "dumper",
    slug: "dumper",
    name: "Hjuldumper Batteri",
    pricePerDay: 900,
    info: null,
    category: "entreprenad",
  },
  {
    id: "markvibrator",
    slug: "markvibrator",
    name: "Markvibrator",
    pricePerDay: 600,
    info: null,
    category: "entreprenad",
  },
  {
    id: "kompaktor",
    slug: "kompaktor",
    name: "Kompaktor / Platta",
    pricePerDay: 750,
    info: null,
    category: "entreprenad",
  },
  {
    id: "bastuvagn",
    slug: "bastuvagn",
    name: "Mobil Bastuvagn Lyx",
    pricePerDay: 2500,
    info: "Plats för 6 pers",
    category: "event",
  },
  {
    id: "badtunna",
    slug: "badtunna",
    name: "Badtunna",
    pricePerDay: 1200,
    info: null,
    category: "event",
  },
];

export const ENTREPRENAD_PRODUCTS = MOCK_PRODUCTS.filter(
  (p) => p.category === "entreprenad",
);

export const EVENT_PRODUCTS = MOCK_PRODUCTS.filter(
  (p) => p.category === "event",
);
