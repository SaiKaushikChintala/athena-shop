import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { type ProductCardData } from "@/types";

type Props = {
  product: ProductCardData;
  sizes?: string;
  className?: string;
};

export function ProductCard({
  product,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className,
}: Props): React.ReactElement {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-ring/30 hover:shadow-lg hover:shadow-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.coverImage}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.onSale && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-destructive px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-destructive-foreground shadow-sm">
            {product.salePercent ? `−${product.salePercent}%` : "Sale"}
          </span>
        )}
        {product.reviewsCount > 0 && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            <Star className="size-3 fill-rating text-rating" />
            {product.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">({product.reviewsCount})</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="font-mono text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground">
          {product.brand}
        </p>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {product.name}
        </p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <p className={cn("text-sm font-semibold tabular-nums", product.onSale ? "text-destructive" : "text-foreground")}>
            {product.priceLabel}
          </p>
          {product.compareAtLabel && (
            <p className="text-xs tabular-nums text-muted-foreground line-through">
              {product.compareAtLabel}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
