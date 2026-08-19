import Link from "next/link";
import Image from "next/image";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { type Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { PageShell, SectionHeading } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { RecentlyViewed } from "@/components/recently-viewed";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { CARD_SELECT, priceLabel, toCardData } from "@/lib/product";

export const metadata: Metadata = {
  description: "Shop the full Athena collection — new arrivals, featured picks, and more.",
};

const PERKS = [
  { icon: Truck, title: "Free shipping", body: "On every order, no minimum." },
  { icon: RotateCcw, title: "Easy returns", body: "Send back any single item." },
  { icon: ShieldCheck, title: "Secure checkout", body: "Pay by card, UPI, or on delivery." },
];

const LIVE_PRODUCT = { product: { deletedAt: null } };

export default async function HomePage(): Promise<React.ReactElement> {
  const { customer, initials, cartCount } = await getHeaderData();

  const [categories, featuredRows, newest, topRated] = await Promise.all([
    db.category.findMany({
      where: { products: { some: LIVE_PRODUCT } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        products: { where: LIVE_PRODUCT, take: 1, select: { product: { select: { coverImage: true } } } },
        _count: { select: { products: { where: LIVE_PRODUCT } } },
      },
    }),
    db.featured.findMany({
      where: LIVE_PRODUCT,
      orderBy: { position: "asc" },
      take: 5,
      select: { product: { select: CARD_SELECT } },
    }),
    db.product.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 9, select: CARD_SELECT }),
    db.product.findMany({
      where: { deletedAt: null, reviewsCount: { gt: 0 } },
      orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
      take: 4,
      select: CARD_SELECT,
    }),
  ]);

  const featured = featuredRows.map((f) => f.product);
  const heroProduct = featured[0] ?? newest[0] ?? null;
  const featuredRest = featured.filter((p) => p.id !== heroProduct?.id).slice(0, 4);
  const newestList = newest.filter((p) => p.id !== heroProduct?.id).slice(0, 8);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />

      <PageShell className="gap-12 sm:gap-16">
        <section className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-accent via-card to-background">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative grid grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-12 lg:p-14">
            <div className="flex flex-col items-start gap-5">
              <span className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <span className="size-1.5 rounded-full bg-success" />
                Welcome back, {customer.firstName}
              </span>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Everything in the{" "}
                <span className="bg-linear-to-r from-primary to-chart-5 bg-clip-text text-transparent">Athena</span>{" "}
                collection.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                {newest.length > 0
                  ? "Independent makers, one checkout. Browse by category, track every order, and return any item on its own."
                  : "The catalogue is still being stocked. Check back shortly."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  Shop all products
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex h-11 items-center gap-2 rounded-full border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Track an order
                </Link>
              </div>
            </div>

            {heroProduct && (
              <Link
                href={`/products/${heroProduct.slug}`}
                className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-muted shadow-xl shadow-primary/10 lg:aspect-square"
              >
                <Image
                  src={heroProduct.coverImage}
                  alt={heroProduct.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-xl bg-background/90 p-4 shadow-lg backdrop-blur sm:inset-x-4 sm:bottom-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground">
                      Featured · {heroProduct.brand}
                    </p>
                    <p className="truncate text-base font-semibold leading-snug text-foreground sm:text-lg">
                      {heroProduct.name}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{priceLabel(heroProduct)}</p>
                </div>
              </Link>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </section>

        {categories.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading title="Shop by category" />
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0">
              {categories.map((c) => {
                const cover = c.products[0]?.product.coverImage;
                const count = c._count.products;

                return (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.slug}`}
                    className="group relative aspect-4/5 w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-muted sm:w-48 md:aspect-square md:w-auto"
                  >
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                      <div>
                        <p className="text-base font-semibold leading-tight text-white">{c.name}</p>
                        <p className="text-xs text-white/75">
                          {count} item{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <RecentlyViewed customerId={customer.id} />

        {featuredRest.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading title="Featured" subtitle="Hand-picked by our sellers" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {featuredRest.map((p) => (
                <ProductCard key={p.id} product={toCardData(p)} />
              ))}
            </div>
          </section>
        )}

        {newestList.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading title="New arrivals" subtitle="Just landed in the shop" href="/products" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {newestList.map((p) => (
                <ProductCard key={p.id} product={toCardData(p)} />
              ))}
            </div>
          </section>
        )}

        {topRated.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading title="Top rated" subtitle="Loved by customers" href="/products?sort=rating" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {topRated.map((p) => (
                <ProductCard key={p.id} product={toCardData(p)} />
              ))}
            </div>
          </section>
        )}

        {newest.length === 0 && (
          <section className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-base font-medium text-foreground">No products yet</p>
            <p className="text-sm text-muted-foreground">
              Once sellers publish their catalogues, everything shows up here.
            </p>
          </section>
        )}
      </PageShell>
    </div>
  );
}
