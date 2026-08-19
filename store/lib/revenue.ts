import { type Money } from "@/types";

type RevenueLine = {
  quantity: number;
  price: Money;
  discount: Money | null;
  couponAmount?: Money | null;
};

function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function lineRevenue(line: RevenueLine): number {
  const unit = (line.discount ?? line.price).toNumber();
  return unit * line.quantity - (line.couponAmount?.toNumber() ?? 0);
}

export function sumRevenue(lines: RevenueLine[]): number {
  return toCents(lines.reduce((sum, line) => sum + lineRevenue(line), 0));
}

export function sumCouponAmount(lines: RevenueLine[]): number {
  return toCents(lines.reduce((sum, line) => sum + (line.couponAmount?.toNumber() ?? 0), 0));
}
