import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageBody, PageHeader, SectionLabel } from "@/components/page-header";
import { OrderItemsTable } from "@/components/order-items-table";
import { OrderStatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { sumCouponAmount, sumRevenue } from "@/lib/revenue";
import { deriveStatus } from "@/lib/fulfilment";
import { formatMoney } from "@/lib/format";
import { type SellerOrderItem } from "@/types";

type Props = { params: Promise<{ id: string }> };

const placedFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" });

export default async function OrderDetailPage({ params }: Props): Promise<React.ReactElement> {
  const { id } = await params;
  const seller = await getSeller();

  const order = await db.order.findFirst({
    where: { id, items: { some: { sellerId: seller.id } } },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      coupon: { select: { code: true } },
      customer: { select: { firstName: true, lastName: true, email: true } },
      address: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          street: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
        },
      },
      items: {
        where: { sellerId: seller.id },
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
              product: { select: { name: true } },
              optionValues: { select: { optionValue: { select: { value: true } } } },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const items: SellerOrderItem[] = order.items.map((item) => {
    const price = item.price.toNumber();
    const discount = item.discount?.toNumber() ?? null;
    return {
      id: item.id,
      orderId: order.id,
      status: item.status,
      quantity: item.quantity,
      price,
      discount,
      productName: item.variant.product.name,
      variantLabel: item.variant.optionValues.map((ov) => ov.optionValue.value).join(" / "),
      subtotal: (discount ?? price) * item.quantity,
    };
  });

  const live = order.items.filter((item) => item.status !== "CANCELLED");
  const couponTotal = sumCouponAmount(live);
  const sellerTotal = sumRevenue(live);
  const address = order.address;

  return (
    <>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description={placedFormat.format(order.createdAt)}
        back={{ href: "/orders", label: "Orders" }}
        action={<OrderStatusBadge status={deriveStatus(order.items.map((item) => item.status))} />}
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <p className="eyebrow">Customer</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{order.customer.email}</p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <p className="eyebrow">Ship to</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">
                {address.firstName} {address.lastName}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">{address.phone}</p>
            </CardContent>
          </Card>
        </div>

        <section className="flex flex-col gap-3">
          <SectionLabel>Your items</SectionLabel>
          <p className="text-xs text-muted-foreground">
            Move each item on its own. Items only go forward, and can be cancelled until they&apos;re delivered
            (cancelling puts the stock back).
          </p>
          <OrderItemsTable items={items} />

          <dl className="flex flex-col gap-1.5 rounded-xl border bg-accent/40 px-4 py-3">
            {couponTotal > 0 && (
              <>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">Item total</dt>
                  <dd className="tabular-nums text-foreground">{formatMoney(sellerTotal + couponTotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground">
                    Customer coupon
                    {order.coupon && (
                      <span className="ml-1.5 font-mono text-xs font-semibold tracking-wider">{order.coupon.code}</span>
                    )}
                  </dt>
                  <dd className="tabular-nums text-foreground">−{formatMoney(couponTotal)}</dd>
                </div>
              </>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <dt className="eyebrow">Your revenue</dt>
              <dd className="font-heading text-lg font-bold tabular-nums text-foreground">{formatMoney(sellerTotal)}</dd>
            </div>
          </dl>
        </section>
      </PageBody>
    </>
  );
}
