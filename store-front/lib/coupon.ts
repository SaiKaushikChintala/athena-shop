import { formatMoney } from "@/lib/format";
import { type Money, type PricedLine } from "@/types";

type CouponRecord = {
  id: string;
  code: string;
  percentage: Money;
  minAmount: Money | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  sellerId: string;
};

type CouponCheck =
  | {
      ok: true;
      couponId: string;
      code: string;
      percentage: number;
      eligibleSubtotal: number;
      discount: number;
    }
  | { ok: false; message: string };

type Allocation<T> = { line: T; amount: number };

export function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function lineTotal(line: PricedLine): number {
  const unit = line.discount?.toNumber() ?? line.price.toNumber();
  return unit * line.quantity;
}

export function cartSubtotal(lines: PricedLine[]): number {
  return toCents(lines.reduce((sum, line) => sum + lineTotal(line), 0));
}

export function subtotalForSeller(lines: PricedLine[], sellerId: string): number {
  return cartSubtotal(lines.filter((line) => line.sellerId === sellerId));
}

export function checkCoupon(
  coupon: CouponRecord | null,
  eligibleSubtotal: number,
  now: Date = new Date(),
): CouponCheck {
  if (!coupon) return { ok: false, message: "That code is not valid." };
  if (!coupon.isActive) return { ok: false, message: "This coupon is no longer active." };

  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, message: "This coupon has expired." };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }

  if (eligibleSubtotal <= 0) {
    return { ok: false, message: "This code does not apply to anything in your cart." };
  }

  const minAmount = coupon.minAmount?.toNumber() ?? null;
  if (minAmount !== null && eligibleSubtotal < minAmount) {
    return {
      ok: false,
      message: `Spend at least ${formatMoney(minAmount)} on eligible items to use this code.`,
    };
  }

  const percentage = coupon.percentage.toNumber();
  const discount = toCents(Math.min(eligibleSubtotal, (eligibleSubtotal * percentage) / 100));

  if (discount <= 0) {
    return { ok: false, message: "This coupon has no value on your cart." };
  }

  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    percentage,
    eligibleSubtotal: toCents(eligibleSubtotal),
    discount,
  };
}

export function allocateDiscount<T extends PricedLine>(
  lines: T[],
  sellerId: string,
  discount: number,
): Allocation<T>[] {
  const result: Allocation<T>[] = lines.map((line) => ({ line, amount: 0 }));
  if (discount <= 0) return result;

  const eligible = result.filter((entry) => entry.line.sellerId === sellerId);
  const eligibleTotal = eligible.reduce((sum, entry) => sum + lineTotal(entry.line), 0);
  if (eligibleTotal <= 0) return result;

  const discountCents = Math.round(discount * 100);
  let assigned = 0;

  for (const entry of eligible) {
    entry.amount = Math.round((discountCents * lineTotal(entry.line)) / eligibleTotal);
    assigned += entry.amount;
  }

  const largest = eligible.reduce((a, b) => (lineTotal(b.line) > lineTotal(a.line) ? b : a));
  largest.amount += discountCents - assigned;

  for (const entry of eligible) {
    const cap = Math.round(lineTotal(entry.line) * 100);
    entry.amount = Math.max(0, Math.min(cap, entry.amount)) / 100;
  }

  return result;
}
