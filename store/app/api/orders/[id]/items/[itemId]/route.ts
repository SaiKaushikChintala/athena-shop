import { z } from "zod";

import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { canMove, deriveStatus, isFinal } from "@/lib/fulfilment";
import { lineRevenue } from "@/lib/revenue";
import { ORDER_STATUSES } from "@/lib/order-status";
import { jsonError, parseBody } from "@/lib/server-utils";

type Context = { params: Promise<{ id: string; itemId: string }> };

type Outcome = { ok: true; orderStatus: string } | { ok: false; status: number; message: string };

const schema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  const seller = await getSeller();
  const { id: orderId, itemId } = await params;

  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;
  const to = body.data.status;

  const outcome = await db.$transaction(async (tx): Promise<Outcome> => {
    const item = await tx.orderItem.findFirst({
      where: { id: itemId, orderId, sellerId: seller.id },
      select: { status: true, quantity: true, variantId: true },
    });
    if (!item) return { ok: false, status: 404, message: "Not found" };

    if (!canMove(item.status, to)) {
      return {
        ok: false,
        status: 409,
        message: isFinal(item.status)
          ? `This item is already ${item.status.toLowerCase()} and can't change.`
          : "Items can only move forward, or be cancelled before delivery.",
      };
    }

    const now = new Date();
    const moved = await tx.orderItem.updateMany({
      where: { id: itemId, status: item.status },
      data: { status: to, deliveredAt: to === "DELIVERED" ? now : null },
    });
    if (moved.count === 0) return { ok: false, status: 409, message: "This item just changed. Refresh and try again." };

    await tx.orderEvent.create({ data: { orderId, orderItemId: itemId, status: to } });

    if (to === "CANCELLED") {
      await tx.variant.update({ where: { id: item.variantId }, data: { quantity: { increment: item.quantity } } });
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        status: true,
        couponId: true,
        paymentMethod: true,
        paymentStatus: true,
        items: { select: { status: true, quantity: true, price: true, discount: true, couponAmount: true } },
      },
    });
    const derived = deriveStatus(order.items.map((line) => line.status));

    if (derived !== order.status) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: derived, deliveredAt: derived === "DELIVERED" ? now : null },
      });
      await tx.orderEvent.create({ data: { orderId, status: derived } });

      if (derived === "CANCELLED" && order.couponId) {
        await tx.coupon.updateMany({
          where: { id: order.couponId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
    }

    if (order.paymentMethod === "PAY_ON_DELIVERY" && order.paymentStatus === "PENDING") {
      if (derived === "DELIVERED") {
        const payable = order.items
          .filter((line) => line.status !== "CANCELLED")
          .reduce((sum, line) => sum + lineRevenue(line), 0);
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "SUCCESSFUL" } });
        await tx.paymentRecord.updateMany({
          where: { orderId },
          data: { status: "SUCCESSFUL", paidAt: now, amount: Math.round(payable * 100) / 100 },
        });
      } else if (derived === "CANCELLED") {
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } });
        await tx.paymentRecord.updateMany({ where: { orderId }, data: { status: "FAILED" } });
      }
    }

    return { ok: true, orderStatus: derived };
  });

  if (!outcome.ok) return jsonError(outcome.message, outcome.status);
  return Response.json({ ok: true, orderStatus: outcome.orderStatus });
}
