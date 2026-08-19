import { z } from "zod";

import { db } from "@/lib/db";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

const ViewSchema = z.object({ productId: z.string().min(1) });

export async function POST(request: Request): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseBody(request, ViewSchema);
  if ("error" in body) return body.error;

  const { productId } = body.data;

  const product = await db.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) return jsonError("Not found", 404);

  await db.recentlyViewed.upsert({
    where: { customerId_productId: { customerId: session.id, productId } },
    create: { customerId: session.id, productId },
    update: { viewedAt: new Date() },
  });

  return Response.json({ ok: true });
}
