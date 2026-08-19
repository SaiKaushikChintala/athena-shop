import crypto from "crypto";
import { z } from "zod";

import { db } from "@/lib/db";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";
import { OrderStatus, PaymentMethod } from "@/.generated/prisma/enums";
import { type Prisma } from "@/.generated/prisma/client";
import { settlePayment } from "@/lib/payment";
import { allocateDiscount, cartSubtotal, checkCoupon, subtotalForSeller, toCents } from "@/lib/coupon";
import { type PricedLine } from "@/types";

const ORDER_STATUS_AT_CREATION = OrderStatus.DELIVERED;

const required = z.string().min(1, { error: "Required" });

const OrderSchema = z.object({
  firstName: required,
  lastName: required,
  phone: required,
  street: required,
  city: required,
  state: required,
  zipCode: required,
  country: required,
  paymentMethod: z.enum(PaymentMethod),
  couponCode: z.string().trim().toUpperCase().nullish(),
  saveAddressAs: z.string().max(40).trim().nullish(),
});

type Line = PricedLine & { variantId: string };

type AppliedCoupon = {
  id: string;
  maxUses: number | null;
  discount: number;
  allocations: Map<string, number>;
};

class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly couponRejected = false,
  ) {
    super(message);
  }
}

async function applyCoupon(
  tx: Prisma.TransactionClient,
  code: string,
  lines: Line[],
): Promise<AppliedCoupon> {
  const coupon = await tx.coupon.findFirst({
    where: { code, sellerId: { in: [...new Set<string>(lines.map((line) => line.sellerId))] } },
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

  const check = checkCoupon(coupon, coupon ? subtotalForSeller(lines, coupon.sellerId) : 0);
  if (!check.ok || !coupon) {
    throw new CheckoutError(check.ok ? "That code is not valid." : check.message, 422, true);
  }

  const allocations = new Map<string, number>(
    allocateDiscount(lines, coupon.sellerId, check.discount)
      .filter((entry) => entry.amount > 0)
      .map((entry) => [entry.line.variantId, entry.amount]),
  );

  return { id: coupon.id, maxUses: coupon.maxUses, discount: check.discount, allocations };
}

export async function POST(request: Request): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseBody(request, OrderSchema);
  if ("error" in body) return body.error;

  const { paymentMethod, couponCode, saveAddressAs, ...shipping } = body.data;

  const cart = await db.cart.findUnique({
    where: { customerId: session.id },
    select: {
      id: true,
      items: {
        select: {
          quantity: true,
          variantId: true,
          variant: {
            select: { price: true, discount: true, product: { select: { sellerId: true, name: true } } },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) return jsonError("Cart is empty", 400);

  const lines: Line[] = cart.items.map((item) => ({
    variantId: item.variantId,
    sellerId: item.variant.product.sellerId,
    quantity: item.quantity,
    price: item.variant.price,
    discount: item.variant.discount,
  }));

  try {
    const order = await db.$transaction(async (tx) => {
      const coupon = couponCode ? await applyCoupon(tx, couponCode, lines) : null;
      const orderTotal = toCents(cartSubtotal(lines) - (coupon?.discount ?? 0));
      const now = new Date();
      const deliveredAt = ORDER_STATUS_AT_CREATION === OrderStatus.DELIVERED ? now : null;

      const address = await tx.address.create({
        data: {
          ...shipping,
          label: `order-${crypto.randomUUID()}`,
          isSnapshot: true,
          customerId: session.id,
        },
        select: { id: true },
      });

      if (saveAddressAs) {
        const taken = await tx.address.findUnique({
          where: { customerId_label: { customerId: session.id, label: saveAddressAs } },
          select: { id: true },
        });

        if (!taken) {
          const saved = await tx.address.count({ where: { customerId: session.id, isSnapshot: false } });
          await tx.address.create({
            data: {
              ...shipping,
              label: saveAddressAs,
              isPrimary: saved === 0,
              customerId: session.id,
            },
          });
        }
      }

      const payment = settlePayment(paymentMethod, ORDER_STATUS_AT_CREATION, crypto.randomUUID());

      const created = await tx.order.create({
        data: {
          orderTotal,
          paymentMethod,
          paymentStatus: payment.status,
          customerId: session.id,
          addressId: address.id,
          couponId: coupon?.id ?? null,
          status: ORDER_STATUS_AT_CREATION,
          deliveredAt,
          items: {
            create: cart.items.map((item) => ({
              status: ORDER_STATUS_AT_CREATION,
              deliveredAt,
              quantity: item.quantity,
              price: item.variant.price,
              discount: item.variant.discount,
              couponAmount: coupon?.allocations.get(item.variantId) ?? null,
              variantId: item.variantId,
              sellerId: item.variant.product.sellerId,
            })),
          },
          payment: {
            create: {
              transactionId: payment.transactionId,
              amount: orderTotal,
              method: paymentMethod,
              status: payment.status,
              paidAt: payment.paidAt,
            },
          },
          events: {
            create: [
              OrderStatus.ORDERED,
              OrderStatus.SHIPPED,
              OrderStatus.OUTFORDELIVERY,
              OrderStatus.DELIVERED,
            ].map((status) => ({ status })),
          },
        },
        select: { id: true, orderNumber: true },
      });

      if (coupon) {
        const claimed = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            ...(coupon.maxUses !== null ? { usedCount: { lt: coupon.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) {
          throw new CheckoutError("This coupon has reached its usage limit.", 422, true);
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      for (const item of cart.items) {
        const claimed = await tx.variant.updateMany({
          where: { id: item.variantId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
        if (claimed.count === 0) {
          throw new CheckoutError(
            `${item.variant.product.name} sold out before your order went through. Adjust your cart and try again.`,
            409,
          );
        }
      }

      return created;
    });

    return Response.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return Response.json(
        { message: error.message, couponRejected: error.couponRejected },
        { status: error.status },
      );
    }
    throw error;
  }
}
