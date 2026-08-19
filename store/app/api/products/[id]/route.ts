import { z } from "zod";

import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { DISCOUNT_ERROR, discountBelowPrice, imageList, productFields, variantFields } from "@/lib/product-schema";
import { isUniqueViolation, jsonError, parseBody } from "@/lib/server-utils";

type Context = { params: Promise<{ id: string }> };

const variantSchema = z
  .object({
    ...variantFields,
    id: z.string(),
    images: imageList.optional(),
    archived: z.boolean(),
  })
  .refine(discountBelowPrice, DISCOUNT_ERROR);

const schema = z.object({
  ...productFields,
  images: imageList.optional(),
  categoryId: z.string().nullable(),
  defaultVariantId: z.string(),
  variants: z.array(variantSchema),
});

export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  const seller = await getSeller();
  const { id } = await params;

  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;

  const existing = await db.product.findUnique({
    where: { id, sellerId: seller.id, deletedAt: null },
    select: { variants: { select: { id: true, deletedAt: true } } },
  });
  if (!existing) return jsonError("Not found", 404);

  const { name, brand, slug, description, coverImage, images, categoryId, defaultVariantId, variants } = body.data;

  const ownVariants = new Map<string, Date | null>(existing.variants.map((v) => [v.id, v.deletedAt]));
  if (variants.some((v) => !ownVariants.has(v.id))) return jsonError("Unknown variant", 422);

  const defaultVariant = variants.find((v) => v.id === defaultVariantId);
  if (!defaultVariant) return jsonError("The default variant must be one of the product's variants", 422);
  if (defaultVariant.archived) return jsonError("The default variant can't be archived", 422);

  const [slugTaken, category] = await Promise.all([
    db.product.findFirst({ where: { slug, NOT: { id } }, select: { id: true } }),
    categoryId ? db.category.findUnique({ where: { id: categoryId }, select: { id: true } }) : null,
  ]);
  if (slugTaken) return jsonError("A product with this slug already exists.", 409);
  if (categoryId && !category) return jsonError("That category no longer exists", 422);

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { name, brand, slug, description, coverImage, defaultVariantId, ...(images && { images }) },
      });

      await tx.productCategory.deleteMany({ where: { productId: id } });
      if (categoryId) await tx.productCategory.create({ data: { productId: id, categoryId } });

      for (const variant of variants) {
        const archivedAt = ownVariants.get(variant.id) ?? null;
        await tx.variant.update({
          where: { id: variant.id },
          data: {
            price: variant.price,
            discount: variant.discount,
            quantity: variant.quantity,
            sku: variant.sku || null,
            ...(variant.coverImage !== undefined && { coverImage: variant.coverImage }),
            ...(variant.images && { images: variant.images }),
            deletedAt: variant.archived ? (archivedAt ?? new Date()) : null,
          },
        });
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("That slug or SKU is already in use", 409);
    throw error;
  }

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  const seller = await getSeller();
  const { id } = await params;

  const deleted = await db.product.updateMany({
    where: { id, sellerId: seller.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (deleted.count === 0) return jsonError("Not found", 404);

  await db.featured.deleteMany({ where: { productId: id } });
  return Response.json({ ok: true });
}
