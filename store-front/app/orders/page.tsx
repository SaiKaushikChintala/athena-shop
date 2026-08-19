import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { type Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { SiteHeader } from "@/components/site-header";
import { PageShell, PageTitle } from "@/components/page-shell";
import { OrderStatusBadge } from "@/components/status-badge";
import { PaginationControls } from "@/components/pagination-controls";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

type Props = { searchParams: Promise<{ page?: string }> };

const PAGE_SIZE = 10;
const MAX_ITEMS_SHOWN = 3;
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function OrdersPage({ searchParams }: Props): Promise<React.ReactElement> {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const { customer, initials, cartCount } = await getHeaderData();

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { customerId: customer.id },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: PAGE_SIZE,
      skip,
      select: {
        id: true,
        orderNumber: true,
        orderTotal: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            variant: {
              select: {
                id: true,
                coverImage: true,
                product: { select: { coverImage: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    }),
    db.order.count({ where: { customerId: customer.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) redirect(totalPages > 1 ? `/orders?page=${totalPages}` : "/orders");

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />

      <PageShell width="narrow">
        <PageTitle
          title="Orders"
          subtitle={total > 0 ? `${total} order${total !== 1 ? "s" : ""}` : undefined}
        />

        {total === 0 ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No orders yet</EmptyTitle>
              <EmptyDescription>
                Once you place an order, you can track it here.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/products">Browse products</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {orders.map((order) => {
                const orderTotal = order.orderTotal.toNumber();
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const shown = order.items.slice(0, MAX_ITEMS_SHOWN);
                const hidden = order.items.length - shown.length;
                const placedAt = dateFormat.format(order.createdAt);

                return (
                  <div
                    key={order.id}
                    className="relative flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-ring/50 hover:bg-accent/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-base font-bold text-foreground after:absolute after:inset-0 after:rounded-xl"
                        >
                          #{order.orderNumber}
                        </Link>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {placedAt}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <Separator />

                    <ul className="flex flex-col gap-3">
                      {shown.map((item) => (
                        <li key={item.variant.id} className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={item.variant.coverImage ?? item.variant.product.coverImage}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <Link
                            href={`/products/${item.variant.product.slug}`}
                            className="relative z-10 min-w-0 truncate text-sm font-medium text-foreground hover:underline"
                          >
                            {item.variant.product.name}
                          </Link>
                          <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-muted-foreground">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                        {hidden > 0 && ` · +${hidden} more product${hidden !== 1 ? "s" : ""}`}
                      </span>
                      <p className="font-heading text-base font-bold tabular-nums text-foreground">
                        {formatMoney(orderTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              prevUrl={page > 1 ? `/orders?page=${page - 1}` : null}
              nextUrl={page < totalPages ? `/orders?page=${page + 1}` : null}
            />
          </>
        )}
      </PageShell>
    </div>
  );
}
