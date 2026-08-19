import { z } from "zod";

import { db } from "@/lib/db";
import { refreshProductRating } from "@/lib/reviews";
import { ReviewFields } from "@/lib/review-schema";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

const CreateSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  ...ReviewFields,
});

export async function POST(request: Request): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseBody(request, CreateSchema);
  if ("error" in body) return body.error;

  const { productId, variantId, rating, title, review } = body.data;

  const delivered = await db.orderItem.findFirst({
    where: { variantId, variant: { productId }, status: "DELIVERED", order: { customerId: session.id } },
    select: { id: true },
  });
  if (!delivered) return jsonError("You can review a product once your order has been delivered.", 403);

  const existing = await db.review.findUnique({
    where: { productId_customerId: { productId, customerId: session.id } },
    select: { id: true },
  });
  if (existing) return jsonError("You've already reviewed this product. Edit your review instead.", 409);

  const created = await db.$transaction(async (tx) => {
    const row = await tx.review.create({
      data: { productId, variantId, customerId: session.id, rating, title, review },
      select: { id: true },
    });
    await refreshProductRating(tx, productId);
    return row;
  });

  return Response.json(created, { status: 201 });
}
