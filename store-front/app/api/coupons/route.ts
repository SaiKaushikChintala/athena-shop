import { z } from "zod";

import { db } from "@/lib/db";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";
import { cartSubtotal, checkCoupon, subtotalForSeller, toCents } from "@/lib/coupon";
import { type PricedLine } from "@/types";

const PreviewSchema = z.object({
  code: z.string().min(1, { error: "Enter a code" }).max(64).trim().toUpperCase(),
});

export async function POST(request: Request): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseBody(request, PreviewSchema);
  if ("error" in body) return body.error;

  const cart = await db.cart.findUnique({
    where: { customerId: session.id },
    select: {
      items: {
        select: {
          quantity: true,
          variant: { select: { price: true, discount: true, product: { select: { sellerId: true } } } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) return jsonError("Your cart is empty.", 400);

  const lines: PricedLine[] = cart.items.map((item) => ({
    sellerId: item.variant.product.sellerId,
    quantity: item.quantity,
    price: item.variant.price,
    discount: item.variant.discount,
  }));

  const coupon = await db.coupon.findFirst({
    where: { code: body.data.code, sellerId: { in: [...new Set<string>(lines.map((line) => line.sellerId))] } },
    select: {
      id: true,
      code: true,
      percentage: true,
      minAmount: true,
      maxUses: true,
      usedCount: true,
      isActive: true,
      expiresAt: true,
      sellerId: true,
    },
  });

  const result = checkCoupon(coupon, coupon ? subtotalForSeller(lines, coupon.sellerId) : 0);
  if (!result.ok) return jsonError(result.message, 422);

  const subtotal = cartSubtotal(lines);

  return Response.json({
    code: result.code,
    percentage: result.percentage,
    discount: result.discount,
    eligibleSubtotal: result.eligibleSubtotal,
    subtotal,
    total: toCents(subtotal - result.discount),
  });
}
