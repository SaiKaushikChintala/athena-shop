import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { type Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { PageShell } from "@/components/page-shell";
import { OptionSelector } from "@/components/option-selector";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ReviewsSection } from "@/components/reviews-section";
import { TrackView } from "@/components/track-view";
import { ProductGallery } from "@/components/product-gallery";
import { RecentlyViewed } from "@/components/recently-viewed";
import { RelatedProducts } from "@/components/related-products";
import { BoughtTogether } from "@/components/bought-together";
import { Stars } from "@/components/stars";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { coPurchasedIds } from "@/lib/recommendations";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type Review } from "@/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
};

const LOW_STOCK = 5;

const PERKS = [
  { icon: Truck, label: "Free shipping" },
  { icon: RotateCcw, label: "Easy returns" },
  { icon: ShieldCheck, label: "Secure checkout" },
];

const VARIANT_SELECT = {
  id: true,
  price: true,
  discount: true,
  quantity: true,
  coverImage: true,
  images: true,
  optionValues: { select: { optionValue: { select: { value: true, option: { select: { name: true } } } } } },
} as const;

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      brand: true,
      description: true,
      coverImage: true,
      images: true,
      rating: true,
      reviewsCount: true,
      defaultVariant: { select: VARIANT_SELECT },
      variants: { where: { deletedAt: null }, select: VARIANT_SELECT },
      options: {
        orderBy: { position: "asc" },
        select: { name: true, values: { orderBy: { position: "asc" }, select: { value: true, meta: true } } },
      },
    },
  });
}

function stockLabel(quantity: number): string {
  if (quantity <= 0) return "Out of stock";
  return quantity <= LOW_STOCK ? `Only ${quantity} left` : `${quantity} in stock`;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug, deletedAt: null },
    select: { name: true, brand: true, description: true, coverImage: true },
  });
  if (!product) return {};

  const title = `${product.name} — ${product.brand}`;
  const description = product.description.slice(0, 160);
  return { title, description, openGraph: { title, description, images: [{ url: product.coverImage }] } };
}

export default async function ProductPage({ params, searchParams }: Props): Promise<React.ReactElement> {
  const { slug } = await params;
  const sp = await searchParams;

  const [product, { customer, initials, cartCount }] = await Promise.all([getProduct(slug), getHeaderData()]);
  if (!product) notFound();

  const [rawReviews, ownReview, deliveredPurchase, boughtTogetherIds] = await Promise.all([
    db.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        review: true,
        rating: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
    db.review.findUnique({
      where: { productId_customerId: { productId: product.id, customerId: customer.id } },
      select: { id: true, rating: true, title: true, review: true },
    }),
    db.orderItem.findFirst({
      where: { variant: { productId: product.id }, status: "DELIVERED", order: { customerId: customer.id } },
      orderBy: { order: { createdAt: "desc" } },
      select: { variantId: true },
    }),
    coPurchasedIds(product.id, 4),
  ]);

  const reviews: Review[] = rawReviews.map((r) => ({
    ...r,
    rating: r.rating.toNumber(),
    createdAt: r.createdAt.toISOString(),
  }));
  const myReview = ownReview ? { ...ownReview, rating: ownReview.rating.toNumber() } : null;

  const requested = Object.entries(sp);
  const selectedVariant =
    (requested.length > 0 &&
      product.variants.find((v) =>
        requested.every(([name, value]) =>
          v.optionValues.some((ov) => ov.optionValue.value === value && ov.optionValue.option.name === name),
        ),
      )) ||
    product.defaultVariant;

  const selectedParams = Object.fromEntries(
    (selectedVariant?.optionValues ?? []).map((ov) => [ov.optionValue.option.name, ov.optionValue.value]),
  );

  const price = selectedVariant?.price.toNumber() ?? 0;
  const discount = selectedVariant?.discount?.toNumber() ?? null;
  const stock = selectedVariant?.quantity ?? 0;
  const displayImage = selectedVariant?.coverImage ?? product.coverImage;
  const galleryImages = [
    ...new Set<string>([displayImage, ...(selectedVariant?.images.length ? selectedVariant.images : product.images)]),
  ];

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />
      <TrackView productId={product.id} />

      <PageShell>
        <nav aria-label="Breadcrumb" className="-mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/products" className="transition-colors hover:text-foreground">
            Shop
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-14">
          <ProductGallery key={displayImage} images={galleryImages} alt={product.name} />

          <div className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary">
                {product.brand}
              </p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground lg:text-4xl">
                {product.name}
              </h1>

              <a
                href="#reviews"
                className="group flex items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {product.reviewsCount > 0 ? (
                  <>
                    <Stars rating={Math.round(product.rating.toNumber())} size="sm" />
                    <span className="font-semibold text-foreground">{product.rating.toNumber().toFixed(1)}</span>
                    <span className="underline-offset-4 group-hover:underline">
                      {product.reviewsCount} review{product.reviewsCount !== 1 ? "s" : ""}
                    </span>
                  </>
                ) : (
                  <span className="underline-offset-4 group-hover:underline">No reviews yet</span>
                )}
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
              <span
                className={cn("text-3xl font-bold tabular-nums", discount !== null ? "text-destructive" : "text-foreground")}
              >
                {formatMoney(discount ?? price)}
              </span>
              {discount !== null && (
                <>
                  <span className="text-base tabular-nums text-muted-foreground line-through">{formatMoney(price)}</span>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                    Save {formatMoney(price - discount)} ({Math.round((1 - discount / price) * 100)}%)
                  </span>
                </>
              )}
            </div>

            {product.options.length > 0 && (
              <OptionSelector
                options={product.options.map((o) => ({
                  name: o.name,
                  values: o.values.map((v) => ({ value: v.value, meta: v.meta as Record<string, string> | null })),
                }))}
                selectedParams={selectedParams}
              />
            )}

            <p
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                stock <= 0 ? "text-destructive" : stock <= LOW_STOCK ? "text-warning" : "text-success",
              )}
            >
              <span className="size-2 rounded-full bg-current" />
              {stockLabel(stock)}
            </p>

            <AddToCartButton variantId={selectedVariant?.id ?? ""} inStock={stock > 0} />

            <ul className="flex flex-wrap gap-2">
              {PERKS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 whitespace-nowrap rounded-full bg-muted/70 px-3 py-2 text-xs font-medium text-foreground"
                >
                  <Icon className="size-4 shrink-0 text-primary" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 border-t pt-6">
              <h2 className="text-sm font-semibold text-foreground">About this product</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-10 sm:mt-12">
          <ReviewsSection
            productId={product.id}
            deliveredVariantId={deliveredPurchase?.variantId ?? null}
            reviews={reviews}
            myReview={myReview}
          />
        </div>

        <BoughtTogether productId={product.id} />

        <RelatedProducts productId={product.id} exclude={boughtTogetherIds} />

        <RecentlyViewed customerId={customer.id} excludeProductId={product.id} />
      </PageShell>
    </div>
  );
}
