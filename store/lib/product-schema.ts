import { z } from "zod";

export const imageList = z.array(z.string().min(1)).max(12);

export const productFields = {
  name: z.string().trim().min(1, { error: "Name is required" }),
  brand: z.string().trim().min(1, { error: "Brand is required" }),
  slug: z
    .string()
    .min(1, { error: "Slug is required" })
    .regex(/^[a-z0-9-]+$/, { error: "Slug must be lowercase letters, numbers, and hyphens only" }),
  description: z.string().trim().min(1, { error: "Description is required" }),
  coverImage: z.string().min(1, { error: "Cover image is required" }),
};

export const variantFields = {
  price: z.number().positive({ error: "Price must be positive" }),
  discount: z.number().positive().nullable(),
  quantity: z.number().int().min(0),
  sku: z.string().trim().optional(),
  coverImage: z.string().min(1).nullable().optional(),
};

export function discountBelowPrice(variant: { price: number; discount?: number | null }): boolean {
  return variant.discount == null || variant.discount < variant.price;
}

export const DISCOUNT_ERROR = { error: "Sale price must be lower than the price", path: ["discount"] };
