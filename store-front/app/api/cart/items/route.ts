import { z } from "zod";

import { db } from "@/lib/db";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

const AddItemSchema = z.object({
  variantId: z.string().min(1, { error: "variantId is required" }),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(request: Request): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseBody(request, AddItemSchema);
  if ("error" in body) return body.error;

  const { variantId, quantity } = body.data;

  const variant = await db.variant.findFirst({
    where: { id: variantId, deletedAt: null, quantity: { gt: 0 } },
    select: { quantity: true },
  });
  if (!variant) return jsonError("Variant not available", 404);

  const cart = await db.cart.upsert({
    where: { customerId: session.id },
    create: { customerId: session.id },
    update: {},
    select: { id: true },
  });

  const inCart = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    select: { quantity: true },
  });

  if ((inCart?.quantity ?? 0) + quantity > variant.quantity) {
    return jsonError(`Only ${variant.quantity} left in stock.`, 409);
  }

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity: { increment: quantity } },
  });

  return Response.json({ ok: true });
}
