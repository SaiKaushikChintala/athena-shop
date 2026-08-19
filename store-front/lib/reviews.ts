import "server-only";

import { type Prisma } from "@/.generated/prisma/client";

export async function refreshProductRating(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  const all = await tx.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  const avg = all.length
    ? Math.round((all.reduce((s, r) => s + r.rating.toNumber(), 0) / all.length) * 10) / 10
    : 0;

  await tx.product.update({
    where: { id: productId },
    data: { rating: avg, reviewsCount: all.length },
  });
}
