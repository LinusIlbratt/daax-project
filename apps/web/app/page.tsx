import { getProducts } from "@/lib/products-data";
import { siteContent } from "@/theme/site-content";
import {
  ContactStrip,
  HomeHero,
  HowItWorksSection,
} from "@/components/rental/home-sections";
import { RentalProductCard } from "@/components/rental/product-card";

export const metadata = {
  title: siteContent.meta.title,
  description: siteContent.meta.description,
};

export const revalidate = 60;

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-brand-bg">
      <HomeHero />
      <HowItWorksSection />

      <section
        id="utbud"
        className="theme-section border-t border-brand-border bg-brand-surface scroll-mt-[var(--theme-header-height)]"
      >
        <div className="theme-container">
          <h2 className="theme-heading-md">{siteContent.home.productsHeading}</h2>
          <p className="mt-2 text-sm text-brand-text-muted">
            {siteContent.home.productsIntro}
          </p>
          {products.length === 0 ? (
            <p className="mt-8 text-brand-text-muted">
              {siteContent.home.productsEmpty}
            </p>
          ) : (
            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.slug}>
                  <RentalProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ContactStrip />
    </main>
  );
}
