import { z } from "zod";

import { db } from "@/lib/db";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

const ReturnSchema = z.object({
  orderItemId: z.string().min(1, { error: "Choose an item to return" }),
  quantity: z.number().int().min(1, { error: "Return at least one unit" }),
  reason: z.string().trim().min(10, { error: "Please describe the reason (at least 10 characters)" }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const { id: orderId } = await params;
  const body = await parseBody(request, ReturnSchema);
  if ("error" in body) return body.error;

  const { orderItemId, quantity, reason } = body.data;

  return db.$transaction(async (tx) => {
    const item = await tx.orderItem.findFirst({
      where: { id: orderItemId, orderId, order: { customerId: session.id } },
      select: {
        quantity: true,
        status: true,
        returnItems: {
          where: { returnRequest: { status: { not: "REJECTED" } } },
          select: { quantity: true },
        },
      },
    });

    if (!item) return jsonError("Item not found on this order", 404);
    if (item.status !== "DELIVERED") return jsonError("Only delivered items can be returned", 400);

    const returnable = item.quantity - item.returnItems.reduce((sum, r) => sum + r.quantity, 0);
    if (returnable <= 0) return jsonError("This item has already been returned", 409);
    if (quantity > returnable) {
      return jsonError(
        `Only ${returnable} more unit${returnable === 1 ? "" : "s"} of this item can be returned`,
        409,
      );
    }

    const created = await tx.returnRequest.create({
      data: { orderId, reason, items: { create: { orderItemId, quantity } } },
      select: { id: true, status: true, createdAt: true },
    });

    return Response.json(created, { status: 201 });
  });
}
