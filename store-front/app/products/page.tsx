import { redirect } from "next/navigation";
import { SearchX } from "lucide-react";
import { type Metadata } from "next";

import { type Prisma } from "@/.generated/prisma/client";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { SiteHeader } from "@/components/site-header";
import { PageShell, PageTitle } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import { PaginationControls } from "@/components/pagination-controls";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { CARD_SELECT, toCardData } from "@/lib/product";
import { type Money, type SortKey } from "@/types";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our full collection of products.",
};

type Props = {
  searchParams: Promise<{ q?: string; category?: string; page?: string; sort?: string; min?: string; max?: string }>;
};

type Filters = {
  q: string;
  category: string;
  sort: SortKey;
  min: string;
  max: string;
};

const PAGE_SIZE = 12;

const ORDER_BY: Record<"newest" | "rating", Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  rating: [{ rating: "desc" }, { reviewsCount: "desc" }, { id: "asc" }],
};

function asSort(value: string | undefined): SortKey {
  return value === "price-asc" || value === "price-desc" || value === "rating" ? value : "newest";
}

function asPrice(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function priceWhere(min: number | null, max: number | null): Prisma.ProductWhereInput {
  if (min === null && max === null) return {};
  const range = { ...(min !== null ? { gte: min } : {}), ...(max !== null ? { lte: max } : {}) };
  return { variants: { some: { deletedAt: null, OR: [{ discount: null, price: range }, { discount: range }] } } };
}

function lowestPrice(variants: { price: Money; discount: Money | null }[]): number {
  if (variants.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...variants.map((v) => (v.discount ?? v.price).toNumber()));
}

function buildPageUrl(page: number, filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.min) params.set("min", filters.min);
  if (filters.max) params.set("max", filters.max);
  if (page > 1) params.set("page", String(page));
  return params.size > 0 ? `/products?${params}` : "/products";
}

async function getProducts(filters: Filters, page: number) {
  const skip = (page - 1) * PAGE_SIZE;
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(filters.q && {
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { brand: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
    ...(filters.category && { categories: { some: { category: { slug: filters.category } } } }),
    ...priceWhere(asPrice(filters.min), asPrice(filters.max)),
  };

  if (filters.sort === "newest" || filters.sort === "rating") {
    const [items, total] = await Promise.all([
      db.product.findMany({ where, orderBy: ORDER_BY[filters.sort], take: PAGE_SIZE, skip, select: CARD_SELECT }),
      db.product.count({ where }),
    ]);
    return { items, total };
  }

  const direction = filters.sort === "price-asc" ? 1 : -1;
  const ranked = (
    await db.product.findMany({
      where,
      select: { id: true, name: true, variants: { where: { deletedAt: null }, select: { price: true, discount: true } } },
    })
  )
    .map((p) => ({ id: p.id, name: p.name, price: lowestPrice(p.variants) }))
    .sort((a, b) => (a.price === b.price ? a.name.localeCompare(b.name) : (a.price - b.price) * direction));

  const pageIds = ranked.slice(skip, skip + PAGE_SIZE).map((p) => p.id);
  const rows = await db.product.findMany({ where: { id: { in: pageIds } }, select: CARD_SELECT });
  const byId = new Map<string, (typeof rows)[number]>(rows.map((row) => [row.id, row]));

  return { items: pageIds.flatMap((id) => byId.get(id) ?? []), total: ranked.length };
}

export default async function ProductsPage({ searchParams }: Props): Promise<React.ReactElement> {
  const sp = await searchParams;
  const filters: Filters = {
    q: sp.q?.trim() ?? "",
    category: sp.category ?? "",
    sort: asSort(sp.sort),
    min: sp.min ?? "",
    max: sp.max ?? "",
  };
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ initials, cartCount }, { items: products, total }, categories] = await Promise.all([
    getHeaderData(),
    getProducts(filters, page),
    db.category.findMany({
      where: { products: { some: { product: { deletedAt: null } } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) redirect(buildPageUrl(totalPages, filters));

  const filtered = Boolean(filters.q || filters.category || filters.min || filters.max);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />

      <PageShell>
        <PageTitle
          title="Products"
          subtitle={`${total} item${total !== 1 ? "s" : ""}${filtered ? " matching your filters" : ""}`}
        />

        <ProductFilters
          categories={categories}
          currentQ={filters.q}
          currentCategory={filters.category}
          currentSort={filters.sort}
          currentMin={filters.min}
          currentMax={filters.max}
        />

        {products.length === 0 ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No products found</EmptyTitle>
              <EmptyDescription>Try a different search, or clear the filters to see everything.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={toCardData(product)} />
              ))}
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              prevUrl={page > 1 ? buildPageUrl(page - 1, filters) : null}
              nextUrl={page < totalPages ? buildPageUrl(page + 1, filters) : null}
            />
          </>
        )}
      </PageShell>
    </div>
  );
}
