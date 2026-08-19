import { type VariantDraft } from "@/types";

type VariantPayload = {
  price: number;
  discount: number | null;
  quantity: number;
  sku: string | undefined;
  coverImage: string | null;
  images: string[];
};

export function emptyDraft(): VariantDraft {
  return { price: "", discount: "", quantity: "0", sku: "", coverImage: "", images: [] };
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toPayload(draft: VariantDraft): VariantPayload {
  const price = Number.parseFloat(draft.price);
  const discount = draft.discount ? Number.parseFloat(draft.discount) : Number.NaN;
  const quantity = Number.parseInt(draft.quantity, 10);

  return {
    price: Number.isNaN(price) ? 0 : price,
    discount: Number.isNaN(discount) || discount <= 0 ? null : discount,
    quantity: Number.isNaN(quantity) ? 0 : quantity,
    sku: draft.sku.trim() || undefined,
    coverImage: draft.coverImage.trim() || null,
    images: draft.images,
  };
}

export function payloadError(variants: VariantPayload[]): string | null {
  if (variants.some((v) => v.price <= 0)) return "All variants must have a price greater than 0.";
  if (variants.some((v) => v.discount !== null && v.discount >= v.price)) {
    return "A sale price must be lower than the regular price.";
  }
  if (variants.some((v) => v.quantity < 0)) return "Quantities can't be negative.";
  return null;
}
