"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, LayoutList, Package, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { type SellerProduct } from "@/types";

type View = "list" | "grid";

function priceRange(variants: SellerProduct["variants"]): string {
  if (variants.length === 0) return "—";
  const prices = variants.map((v) => v.discount ?? v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
}

function variantSummary(product: SellerProduct): string {
  if (product.options.length === 0) return "1 variant";
  const count = product.variants.length;
  const breakdown = product.options.map((o) => `${o.valueCount} ${o.name}`).join(" × ");
  return `${count} variant${count !== 1 ? "s" : ""} (${breakdown})`;
}

function StockLabel({ product }: { product: SellerProduct }): React.ReactElement {
  const stock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
  return (
    <p className={cn("text-xs tabular-nums", stock === 0 ? "text-destructive" : "text-muted-foreground")}>
      {stock === 0 ? "Out of stock" : `${stock} in stock`}
    </p>
  );
}

function FeatureToggle({ product }: { product: SellerProduct }): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [featured, setFeatured] = useState<boolean>(product.featured);

  async function toggle(e: React.MouseEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    const next = !featured;
    setFeatured(next);
    try {
      const res = await fetch("/api/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, featured: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setFeatured(!next);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggle}
          disabled={pending}
          aria-pressed={featured}
          aria-label={featured ? "Remove from featured" : "Feature on storefront"}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            featured
              ? "text-rating hover:bg-rating/15"
              : "text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground",
          )}
        >
          <Star className={cn("size-4", featured && "fill-current")} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{featured ? "Featured on the storefront" : "Feature on the storefront"}</TooltipContent>
    </Tooltip>
  );
}

export function ProductsList({ products }: { products: SellerProduct[] }): React.ReactElement {
  const [view, setView] = useState<View>("list");

  if (products.length === 0) {
    return (
      <Empty className="border py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyTitle>No products yet</EmptyTitle>
          <EmptyDescription>Add a product with its options and variants, and it goes live on your storefront.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/products/new">Add your first product</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => {
          if (value === "list" || value === "grid") setView(value);
        }}
        variant="outline"
        size="sm"
        spacing={0}
        className="self-end"
      >
        <ToggleGroupItem value="list" aria-label="List view">
          <LayoutList />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid />
        </ToggleGroupItem>
      </ToggleGroup>

      {view === "list" ? (
        <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/50"
            >
              <Image
                src={product.coverImage}
                alt=""
                width={44}
                height={44}
                unoptimized
                className="size-11 shrink-0 rounded-lg bg-muted object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">{product.name}</p>
                  {product.category && (
                    <Badge variant="secondary" className="shrink-0">
                      {product.category}
                    </Badge>
                  )}
                </div>
                <p className="eyebrow">{product.brand}</p>
                <p className="text-xs text-muted-foreground">{variantSummary(product)}</p>
              </div>

              <FeatureToggle product={product} />

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">{priceRange(product.variants)}</p>
                <StockLabel product={product} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border transition-colors hover:border-ring/60 hover:bg-accent/30"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.coverImage}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute right-2 top-2 rounded-lg bg-background/85 backdrop-blur">
                  <FeatureToggle product={product} />
                </div>
              </div>

              <div className="flex flex-col gap-1 p-3">
                <div className="flex items-start justify-between gap-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{product.name}</p>
                  {product.category && (
                    <Badge variant="secondary" className="shrink-0">
                      {product.category}
                    </Badge>
                  )}
                </div>
                <p className="eyebrow">{product.brand}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold tabular-nums text-foreground">{priceRange(product.variants)}</p>
                  <StockLabel product={product} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
