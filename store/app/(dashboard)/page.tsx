import Link from "next/link";
import { ArrowRight, Package, Plus, ShoppingBag, Star, Tag, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageBody, PageHeader, SectionLabel } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { sumRevenue } from "@/lib/revenue";
import { daysAgo } from "@/lib/dates";
import { deriveStatus } from "@/lib/fulfilment";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const todayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const QUICK_LINKS = [
  { href: "/coupons/new", icon: Tag, label: "New coupon" },
  { href: "/orders", icon: ShoppingBag, label: "View orders" },
];

function RatingStars({ value }: { value: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className="relative inline-flex">
            <Star className="size-4 fill-current text-muted-foreground/25" />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="size-4 fill-current text-rating" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const seller = await getSeller();
  const mine = { items: { some: { sellerId: seller.id } } };

  const [orderItems30d, productsCount, activeCoupons, recentOrders, totalOrders, ratings] = await Promise.all([
    db.orderItem.findMany({
      where: { sellerId: seller.id, status: { not: "CANCELLED" }, order: { createdAt: { gte: daysAgo(30) } } },
      select: { price: true, discount: true, couponAmount: true, quantity: true, orderId: true },
    }),
    db.product.count({ where: { sellerId: seller.id, deletedAt: null } }),
    db.coupon.count({ where: { sellerId: seller.id, isActive: true } }),
    db.order.findMany({
      where: mine,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true } },
        items: {
          where: { sellerId: seller.id },
          select: { status: true, price: true, discount: true, couponAmount: true, quantity: true },
        },
      },
    }),
    db.order.count({ where: mine }),
    db.review.aggregate({
      where: { product: { sellerId: seller.id } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const stats = [
    {
      label: "Revenue",
      hint: "Last 30 days",
      value: formatMoney(sumRevenue(orderItems30d)),
      icon: Wallet,
      tone: "bg-success/12 text-success",
    },
    {
      label: "Orders",
      hint: "Last 30 days",
      value: String(new Set<string>(orderItems30d.map((i) => i.orderId)).size),
      icon: ShoppingBag,
      tone: "bg-info/12 text-info",
    },
    { label: "Products", hint: "Live", value: String(productsCount), icon: Package, tone: "bg-primary/10 text-primary" },
    { label: "Coupons", hint: "Active", value: String(activeCoupons), icon: Tag, tone: "bg-rating/20 text-warning" },
  ];

  const reviewCount = ratings._count.rating;
  const avgRating = ratings._avg.rating?.toNumber() ?? null;

  return (
    <>
      <PageHeader title="Overview" description={todayFormat.format(new Date())} />

      <PageBody>
        <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-accent via-card to-card p-5 sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Welcome back, {seller.businessName}
                </h2>
                <p className="text-sm text-muted-foreground">Here&apos;s how your shop is doing.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/products/new"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Plus className="size-4" />
                  Add product
                </Link>
                {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-96">
              <div className="rounded-xl border bg-card/80 p-4 backdrop-blur">
                <p className="text-xs font-medium text-muted-foreground">Total orders</p>
                <p className="mt-1 font-heading text-3xl font-bold tracking-tight tabular-nums text-foreground">
                  {totalOrders.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="rounded-xl border bg-card/80 p-4 backdrop-blur">
                <p className="text-xs font-medium text-muted-foreground">Rating</p>
                {avgRating === null ? (
                  <>
                    <p className="mt-1 font-heading text-3xl font-bold tracking-tight text-muted-foreground/40">—</p>
                    <p className="text-xs text-muted-foreground">No reviews yet</p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 font-heading text-3xl font-bold tracking-tight tabular-nums text-foreground">
                      {avgRating.toFixed(1)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <RatingStars value={avgRating} />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {reviewCount.toLocaleString()} review{reviewCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, hint, value, icon: Icon, tone }) => (
            <Card key={label} size="sm" className="gap-3 transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone)}>
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-0.5">
                <p className="truncate font-heading text-2xl font-bold tracking-tight tabular-nums text-foreground sm:text-3xl">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Recent orders</SectionLabel>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingBag />
                </EmptyMedia>
                <EmptyTitle>No orders yet</EmptyTitle>
                <EmptyDescription>When a customer buys one of your products, the order shows up here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                    <span className="shrink-0 font-mono text-xs font-bold text-muted-foreground">
                      #{order.orderNumber}
                    </span>
                    <span className="truncate text-sm text-foreground">
                      {order.customer.firstName} {order.customer.lastName}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatMoney(sumRevenue(order.items.filter((i) => i.status !== "CANCELLED")))}
                    </span>
                    <OrderStatusBadge status={deriveStatus(order.items.map((i) => i.status))} />
                    <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                      {dateFormat.format(order.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}
