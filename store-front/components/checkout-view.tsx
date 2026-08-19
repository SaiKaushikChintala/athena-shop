"use client";

import { useState } from "react";
import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "@/components/page-shell";
import { CheckoutForm } from "@/components/checkout-form";
import { CouponField } from "@/components/coupon-field";
import { formatMoney } from "@/lib/format";
import { toCents } from "@/lib/coupon";
import { type AppliedCoupon, type CheckoutItem, type SavedAddress } from "@/types";

type Props = {
  items: CheckoutItem[];
  subtotal: number;
  defaultFirstName: string;
  defaultLastName: string;
  addresses: SavedAddress[];
};

export function CheckoutView({
  items,
  subtotal,
  defaultFirstName,
  defaultLastName,
  addresses,
}: Props): React.ReactElement {
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  const discount = coupon?.discount ?? 0;
  const total = toCents(subtotal - discount);

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <CheckoutForm
          defaultFirstName={defaultFirstName}
          defaultLastName={defaultLastName}
          addresses={addresses}
          total={total}
          couponCode={coupon?.code ?? null}
          onCouponRejected={() => setCoupon(null)}
        />
      </div>

      <aside className="w-full rounded-xl border bg-accent/30 p-5 lg:sticky lg:top-24 lg:w-80 lg:shrink-0">
        <SectionLabel>Order summary</SectionLabel>

        <div className="mt-4 flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[0.6rem] font-bold text-primary-foreground">
                  {item.quantity}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                {item.label && (
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                )}
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <CouponField
          applied={coupon}
          onApply={setCoupon}
          onRemove={() => setCoupon(null)}
        />

        <Separator className="my-4" />

        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatMoney(subtotal)}
            </dd>
          </div>

          {coupon && (
            <div className="flex items-center justify-between">
              <dt className="truncate text-success">
                Coupon{" "}
                <span className="font-mono font-semibold tracking-wider">
                  {coupon.code}
                </span>
              </dt>
              <dd className="shrink-0 font-medium tabular-nums text-success">
                −{formatMoney(discount)}
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <dt>Shipping</dt>
            <dd>Free</dd>
          </div>
        </dl>

        <Separator className="my-4" />

        <div className="flex items-baseline justify-between">
          <span className="font-medium text-foreground">Total</span>
          <span className="font-heading text-xl font-bold tabular-nums text-foreground">
            {formatMoney(total)}
          </span>
        </div>
      </aside>
    </div>
  );
}
