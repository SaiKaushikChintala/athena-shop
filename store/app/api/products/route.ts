import { z } from "zod";

import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { DISCOUNT_ERROR, discountBelowPrice, imageList, productFields, variantFields } from "@/lib/product-schema";
import { isUniqueViolation, jsonError, parseBody } from "@/lib/server-utils";

const variantSchema = z
  .object({
    ...variantFields,
    discount: variantFields.discount.optional(),
    optionValues: z.record(z.string(), z.string()),
    images: imageList.default([]),
    isDefault: z.boolean(),
  })
  .refine(discountBelowPrice, DISCOUNT_ERROR);

const optionSchema = z.object({
  name: z.string().trim().min(1, { error: "Option name is required" }),
  values: z
    .array(z.object({ value: z.string().trim().min(1, { error: "Value is required" }), hex: z.string().optional() }))
    .min(1, { error: "At least one value required" }),
});

const schema = z.object({
  ...productFields,
  images: imageList.default([]),
  categoryId: z.string().optional(),
  options: z.array(optionSchema),
  variants: z.array(variantSchema).min(1, { error: "At least one variant is required" }),
});

type Payload = z.infer<typeof schema>;

function structureError({ options, variants }: Payload): string | null {
  const optionNames = new Set<string>(options.map((o) => o.name));
  if (optionNames.size !== options.length) return "Option names must be unique";

  const valuesByOption = new Map<string, Set<string>>();
  for (const option of options) {
    const values = new Set<string>(option.values.map((v) => v.value));
    if (values.size !== option.values.length) return `Values for "${option.name}" must be unique`;
    valuesByOption.set(option.name, values);
  }

  const combos = new Set<string>();
  for (const variant of variants) {
    const entries = Object.entries(variant.optionValues);
    const matches =
      entries.length === optionNames.size &&
      entries.every(([name, value]) => valuesByOption.get(name)?.has(value) ?? false);
    if (!matches) return "Variant option values do not match the defined options";

    const key = options.map((o) => variant.optionValues[o.name]).join("\u0000");
    if (combos.has(key)) return "Each variant must have a unique combination of options";
    combos.add(key);
  }

  if (variants.filter((v) => v.isDefault).length !== 1) return "Exactly one variant must be marked as default";
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const seller = await getSeller();
  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;

  const problem = structureError(body.data);
  if (problem) return jsonError(problem, 422);

  const { name, brand, slug, description, coverImage, images, categoryId, options, variants } = body.data;

  const [slugTaken, category] = await Promise.all([
    db.product.findUnique({ where: { slug }, select: { id: true } }),
    categoryId ? db.category.findUnique({ where: { id: categoryId }, select: { id: true } }) : null,
  ]);
  if (slugTaken) return jsonError("A product with this slug already exists.", 409);
  if (categoryId && !category) return jsonError("That category no longer exists", 422);

  try {
    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          brand,
          slug,
          description,
          coverImage,
          images,
          sellerId: seller.id,
          ...(categoryId && { categories: { create: { categoryId } } }),
        },
        select: { id: true },
      });

      const valueIds = new Map<string, string>();
      for (const [position, option] of options.entries()) {
        const createdOption = await tx.productOption.create({
          data: {
            name: option.name,
            position,
            productId: created.id,
            values: {
              create: option.values.map((v, index) => ({
                value: v.value,
                position: index,
                meta: v.hex ? { hex: v.hex } : undefined,
              })),
            },
          },
          select: { values: { select: { id: true, value: true } } },
        });
        for (const v of createdOption.values) valueIds.set(`${option.name}\u0000${v.value}`, v.id);
      }

      let defaultVariantId: string | null = null;
      for (const variant of variants) {
        const createdVariant = await tx.variant.create({
          data: {
            price: variant.price,
            discount: variant.discount ?? null,
            quantity: variant.quantity,
            sku: variant.sku || null,
            coverImage: variant.coverImage ?? null,
            images: variant.images,
            productId: created.id,
            optionValues: {
              create: Object.entries(variant.optionValues).map(([optionName, value]) => ({
                optionValueId: valueIds.get(`${optionName}\u0000${value}`) ?? "",
              })),
            },
          },
          select: { id: true },
        });
        if (variant.isDefault) defaultVariantId = createdVariant.id;
      }

      return tx.product.update({
        where: { id: created.id },
        data: { defaultVariantId },
        select: { id: true, slug: true },
      });
    });

    return Response.json(product, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("That slug or SKU is already in use", 409);
    throw error;
  }
}
