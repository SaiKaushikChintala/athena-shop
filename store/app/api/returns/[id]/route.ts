import { z } from "zod";

import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { lineRevenue } from "@/lib/revenue";
import { jsonError, parseBody } from "@/lib/server-utils";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "REFUNDED"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const seller = await getSeller();
  const { id } = await params;

  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;
  const { status } = body.data;

  const existing = await db.returnRequest.findFirst({
    where: { id, items: { some: { orderItem: { sellerId: seller.id } } } },
    select: {
      status: true,
      items: {
        where: { orderItem: { sellerId: seller.id } },
        select: {
          quantity: true,
          orderItem: { select: { quantity: true, price: true, discount: true, couponAmount: true } },
        },
      },
    },
  });
  if (!existing) return jsonError("Not found", 404);

  if (existing.status === "REFUNDED") return jsonError("This return has already been refunded.", 409);
  if (existing.status === "REJECTED") return jsonError("This return was rejected and can't be reopened.", 409);
  if (status === "REFUNDED" && existing.status !== "APPROVED") {
    return jsonError("Approve the return before marking it refunded.", 409);
  }

  const refund = existing.items.reduce(
    (sum, item) => sum + (lineRevenue(item.orderItem) / item.orderItem.quantity) * item.quantity,
    0,
  );

  await db.returnRequest.update({
    where: { id },
    data: { status, refundAmount: status === "REFUNDED" ? Math.round(refund * 100) / 100 : null },
  });

  return Response.json({ ok: true });
}
