import { z } from "zod";

import { db } from "@/lib/db";
import { refreshProductRating } from "@/lib/reviews";
import { ReviewFields } from "@/lib/review-schema";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z.object(ReviewFields);

function findOwnReview(id: string, customerId: string) {
  return db.review.findFirst({ where: { id, customerId }, select: { productId: true } });
}

export async function PATCH(request: Request, { params }: Params): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await parseBody(request, UpdateSchema);
  if ("error" in body) return body.error;

  const own = await findOwnReview(id, session.id);
  if (!own) return jsonError("Review not found", 404);

  await db.$transaction(async (tx) => {
    await tx.review.update({ where: { id }, data: body.data });
    await refreshProductRating(tx, own.productId);
  });

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const own = await findOwnReview(id, session.id);
  if (!own) return jsonError("Review not found", 404);

  await db.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    await refreshProductRating(tx, own.productId);
  });

  return Response.json({ ok: true });
}
