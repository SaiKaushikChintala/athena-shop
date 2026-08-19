import { z } from "zod";

import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { couponFields, toExpiry } from "@/lib/coupon-schema";
import { jsonError, parseBody } from "@/lib/server-utils";

type Context = { params: Promise<{ id: string }> };

const schema = z.object(couponFields).partial();

async function findOwnCoupon(id: string, sellerId: string): Promise<{ code: string; usedCount: number } | null> {
  return db.coupon.findFirst({ where: { id, sellerId }, select: { code: true, usedCount: true } });
}

export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  const seller = await getSeller();
  const { id } = await params;

  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;

  const coupon = await findOwnCoupon(id, seller.id);
  if (!coupon) return jsonError("Not found", 404);

  const { expiresAt, ...rest } = body.data;

  if (rest.code && rest.code !== coupon.code) {
    const clash = await db.coupon.findUnique({
      where: { sellerId_code: { sellerId: seller.id, code: rest.code } },
      select: { id: true },
    });
    if (clash) return jsonError("A coupon with this code already exists", 409);
  }

  await db.coupon.update({
    where: { id },
    data: { ...rest, ...(expiresAt !== undefined && { expiresAt: toExpiry(expiresAt) }) },
  });

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  const seller = await getSeller();
  const { id } = await params;

  const coupon = await findOwnCoupon(id, seller.id);
  if (!coupon) return jsonError("Not found", 404);
  if (coupon.usedCount > 0) return jsonError("Cannot delete a coupon that has been used", 409);

  await db.coupon.delete({ where: { id } });
  return Response.json({ ok: true });
}
