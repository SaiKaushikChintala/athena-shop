import { z } from "zod";

import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { jsonError, parseBody } from "@/lib/server-utils";

const schema = z.object({
  productId: z.string().min(1),
  featured: z.boolean(),
});

export async function POST(request: Request): Promise<Response> {
  const seller = await getSeller();
  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;

  const { productId, featured } = body.data;

  const product = await db.product.findFirst({
    where: { id: productId, sellerId: seller.id, deletedAt: null },
    select: { id: true },
  });
  if (!product) return jsonError("Not found", 404);

  if (!featured) {
    await db.featured.deleteMany({ where: { productId } });
    return Response.json({ featured: false });
  }

  const last = await db.featured.findFirst({ orderBy: { position: "desc" }, select: { position: true } });
  await db.featured.upsert({
    where: { productId },
    create: { productId, position: (last?.position ?? 0) + 1 },
    update: {},
  });

  return Response.json({ featured: true });
}
