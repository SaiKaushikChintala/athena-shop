import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";
import { PageShell } from "@/components/page-shell";
import { ReturnRequestSection } from "@/components/return-request-section";
import { MyReview } from "@/components/my-review";
import { OrderStatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { toCents } from "@/lib/coupon";
import { type OwnReview } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
};

const PAYMENT_LABELS: Record<string, string> = {
  UPI: "UPI",
  DEBIT_CARD: "Debit card",
  CREDIT_CARD: "Credit card",
  PAY_ON_DELIVERY: "Pay on delivery",
};

const STATUS_LABEL: Record<string, string> = {
  ORDERED: "Order placed",
  SHIPPED: "Shipped",
  OUTFORDELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const dateTimeFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const placedFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" });

export default async function OrderPage({ params, searchParams }: Props): Promise<React.ReactElement> {
  const { id } = await params;
  const justPlaced = (await searchParams).placed === "1";
  const { customer, initials, cartCount } = await getHeaderData();

  const order = await db.order.findUnique({
    where: { id, customerId: customer.id },
    select: {
      id: true,
      orderNumber: true,
      orderTotal: true,
      paymentMethod: true,
      coupon: { select: { code: true } },
      status: true,
      createdAt: true,
      address: {
        select: { firstName: true, lastName: true, street: true, city: true, state: true, zipCode: true, country: true },
      },
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          status: true,
          quantity: true,
          price: true,
          discount: true,
          couponAmount: true,
          variant: {
            select: {
              id: true,
              productId: true,
              coverImage: true,
              product: { select: { name: true, slug: true, coverImage: true } },
              optionValues: { select: { optionValue: { select: { value: true } } } },
            },
          },
        },
      },
      events: {
        where: { orderItemId: null },
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true, note: true, createdAt: true },
      },
      returns: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          items: { select: { orderItemId: true, quantity: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const myReviews = order.items.some((item) => item.status === "DELIVERED")
    ? await db.review.findMany({
        where: { customerId: customer.id, productId: { in: order.items.map((item) => item.variant.productId) } },
        select: { id: true, productId: true, rating: true, title: true, review: true },
      })
    : [];

  const reviewByProduct = new Map<string, OwnReview>(
    myReviews.map((r) => [r.productId, { id: r.id, rating: r.rating.toNumber(), title: r.title, review: r.review }]),
  );

  const itemsSubtotal = toCents(
    order.items.reduce((sum, item) => sum + (item.discount ?? item.price).toNumber() * item.quantity, 0),
  );
  const couponSaving = toCents(order.items.reduce((sum, item) => sum + (item.couponAmount?.toNumber() ?? 0), 0));

  const itemsForReturn = order.items.map((item) => {
    const returns = order.returns.flatMap((r) =>
      r.items
        .filter((ri) => ri.orderItemId === item.id)
        .map((ri) => ({
          id: r.id,
          reason: r.reason,
          status: r.status,
          quantity: ri.quantity,
          createdAt: r.createdAt.toISOString(),
        })),
    );
    const held = returns.filter((r) => r.status !== "REJECTED").reduce((sum, r) => sum + r.quantity, 0);

    return {
      id: item.id,
      status: item.status,
      quantity: item.quantity,
      returnable: Math.max(0, item.quantity - held),
      name: item.variant.product.name,
      slug: item.variant.product.slug,
      image: item.variant.coverImage ?? item.variant.product.coverImage,
      label: item.variant.optionValues.map((ov) => ov.optionValue.value).join(" / "),
      returns,
    };
  });

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />

      <PageShell width="narrow">
        {justPlaced ? (
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Order confirmed!</h1>
              <p className="mt-1 text-sm text-muted-foreground">Thanks for your order. We&apos;ll get it to you soon.</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-4 py-2 text-center">
              <p className="eyebrow">Order number</p>
              <p className="font-mono text-lg font-bold text-foreground">#{order.orderNumber}</p>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex flex-col gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              All orders
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">Order #{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border">
            <div className="flex flex-col divide-y">
              {order.items.map((item) => {
                const label = item.variant.optionValues.map((ov) => ov.optionValue.value).join(" / ");

                return (
                  <div key={item.id} className="flex flex-col gap-3 p-4">
                    <div className="flex gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={item.variant.coverImage ?? item.variant.product.coverImage}
                          alt={item.variant.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.variant.product.slug}`}
                            className="block truncate text-sm font-medium text-foreground hover:underline"
                          >
                            {item.variant.product.name}
                          </Link>
                          {label && <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>}
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                            <OrderStatusBadge status={item.status} />
                          </div>
                        </div>
                        <p
                          className={cn(
                            "shrink-0 text-sm font-semibold text-foreground",
                            item.status === "CANCELLED" && "text-muted-foreground line-through",
                          )}
                        >
                          {formatMoney((item.discount ?? item.price).toNumber() * item.quantity)}
                        </p>
                      </div>
                    </div>

                    {item.status === "DELIVERED" && (
                      <MyReview
                        productId={item.variant.productId}
                        variantId={item.variant.id}
                        review={reviewByProduct.get(item.variant.productId) ?? null}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            <dl className="flex flex-col gap-1.5 p-4">
              {order.coupon && couponSaving > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums text-foreground">{formatMoney(itemsSubtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-success">
                      Coupon <span className="font-mono font-semibold tracking-wider">{order.coupon.code}</span>
                    </dt>
                    <dd className="tabular-nums text-success">−{formatMoney(couponSaving)}</dd>
                  </div>
                </>
              )}
              <div className="flex items-baseline justify-between">
                <dt className="text-sm font-medium text-foreground">Total</dt>
                <dd className="font-heading text-lg font-bold tabular-nums text-foreground">
                  {formatMoney(order.orderTotal.toNumber())}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="eyebrow mb-2">Shipping to</p>
              <p className="text-sm font-medium text-foreground">
                {order.address.firstName} {order.address.lastName}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {order.address.street}
                <br />
                {order.address.city}, {order.address.state} {order.address.zipCode}
                <br />
                {order.address.country}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="eyebrow mb-2">Payment</p>
              <p className="text-sm font-medium text-foreground">
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Placed {placedFormat.format(order.createdAt)}</p>
            </div>
          </div>

          {order.events.length > 0 && (
            <div className="rounded-xl border p-5">
              <p className="eyebrow mb-4">Tracking</p>
              <ol className="flex flex-col">
                {order.events.map((event, i) => {
                  const isLast = i === order.events.length - 1;
                  return (
                    <li key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "mt-1 size-2.5 shrink-0 rounded-full",
                            isLast ? "bg-foreground" : "bg-muted-foreground/40",
                          )}
                        />
                        {!isLast && <div className="my-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-4">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isLast ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {STATUS_LABEL[event.status] ?? event.status}
                        </p>
                        <p className="text-xs text-muted-foreground/70">{dateTimeFormat.format(event.createdAt)}</p>
                        {event.note && <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <ReturnRequestSection orderId={order.id} items={itemsForReturn} />
        </div>
      </PageShell>
    </div>
  );
}
