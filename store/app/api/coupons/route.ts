import { z } from "zod";

import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { couponFields, toExpiry } from "@/lib/coupon-schema";
import { jsonError, parseBody } from "@/lib/server-utils";

const schema = z.object({
  code: couponFields.code,
  percentage: couponFields.percentage,
  minAmount: couponFields.minAmount.optional(),
  maxUses: couponFields.maxUses.optional(),
  expiresAt: couponFields.expiresAt.optional(),
  isActive: couponFields.isActive.optional(),
});

export async function POST(request: Request): Promise<Response> {
  const seller = await getSeller();
  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;

  const { code, percentage, minAmount, maxUses, expiresAt, isActive } = body.data;

  const existing = await db.coupon.findUnique({
    where: { sellerId_code: { sellerId: seller.id, code } },
    select: { id: true },
  });
  if (existing) return jsonError("A coupon with this code already exists", 409);

  const coupon = await db.coupon.create({
    data: {
      code,
      percentage,
      minAmount: minAmount ?? null,
      maxUses: maxUses ?? null,
      expiresAt: toExpiry(expiresAt ?? null),
      isActive: isActive ?? true,
      sellerId: seller.id,
    },
    select: { id: true, code: true },
  });

  return Response.json(coupon, { status: 201 });
}
