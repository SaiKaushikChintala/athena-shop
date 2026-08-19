import { formatMoney } from "@/lib/format";
import { type Money, type ProductCardData } from "@/types";

export const CARD_SELECT = {
  id: true,
  name: true,
  brand: true,
  slug: true,
  coverImage: true,
  rating: true,
  reviewsCount: true,
  defaultVariant: { select: { price: true, discount: true } },
  variants: { where: { deletedAt: null }, select: { price: true, discount: true } },
} as const;

type PricedVariant = { price: Money; discount: Money | null };

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  coverImage: string;
  rating: Money;
  reviewsCount: number;
  defaultVariant: PricedVariant | null;
  variants: PricedVariant[];
};

function effective(variant: PricedVariant): number {
  return (variant.discount ?? variant.price).toNumber();
}

export function priceLabel(product: ProductRow): string {
  if (product.variants.length > 0) {
    const prices = product.variants.map(effective);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
  }
  return product.defaultVariant ? formatMoney(effective(product.defaultVariant)) : "—";
}

export function toCardData(product: ProductRow): ProductCardData {
  const price = product.defaultVariant?.price.toNumber() ?? 0;
  const sale = product.defaultVariant?.discount?.toNumber() ?? null;
  const salePercent = sale !== null && price > 0 ? Math.round((1 - sale / price) * 100) : 0;

  const prices = product.variants.map(effective);
  const singlePrice = prices.length <= 1 || Math.min(...prices) === Math.max(...prices);

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    slug: product.slug,
    coverImage: product.coverImage,
    priceLabel: priceLabel(product),
    onSale: sale !== null,
    salePercent: salePercent > 0 ? salePercent : null,
    compareAtLabel: sale !== null && singlePrice ? formatMoney(price) : null,
    rating: product.rating.toNumber(),
    reviewsCount: product.reviewsCount,
  };
}
