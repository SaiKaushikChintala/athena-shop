import { z } from "zod";

import { db } from "@/lib/db";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

type Params = { params: Promise<{ variantId: string }> };

const PatchSchema = z.object({
  quantity: z.number().int().min(1, { error: "Quantity must be at least 1" }),
});

async function getCartId(customerId: string): Promise<string | null> {
  const cart = await db.cart.findUnique({ where: { customerId }, select: { id: true } });
  return cart?.id ?? null;
}

export async function PATCH(request: Request, { params }: Params): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const { variantId } = await params;
  const cartId = await getCartId(session.id);
  if (!cartId) return jsonError("Cart not found", 404);

  const body = await parseBody(request, PatchSchema);
  if ("error" in body) return body.error;

  const item = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
    select: { variant: { select: { quantity: true } } },
  });
  if (!item) return jsonError("Item not in cart", 404);

  if (body.data.quantity > item.variant.quantity) {
    return jsonError(`Only ${item.variant.quantity} left in stock.`, 409);
  }

  await db.cartItem.update({
    where: { cartId_variantId: { cartId, variantId } },
    data: { quantity: body.data.quantity },
  });

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const { variantId } = await params;
  const cartId = await getCartId(session.id);
  if (!cartId) return jsonError("Cart not found", 404);

  await db.cartItem.deleteMany({ where: { cartId, variantId } });

  return Response.json({ ok: true });
}
