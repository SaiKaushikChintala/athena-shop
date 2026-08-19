import { PageBody, PageHeader } from "@/components/page-header";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { lineRevenue } from "@/lib/revenue";
import { daysAgo } from "@/lib/dates";
import { deriveStatus } from "@/lib/fulfilment";
import { type OrderSummary } from "@/types";

export default async function AnalyticsPage(): Promise<React.ReactElement> {
  const seller = await getSeller();
  const since = daysAgo(90);

  const rawOrders = await db.order.findMany({
    where: { createdAt: { gte: since }, items: { some: { sellerId: seller.id } } },
    orderBy: { createdAt: "asc" },
    select: {
      customerId: true,
      createdAt: true,
      paymentMethod: true,
      items: {
        where: { sellerId: seller.id },
        select: {
          status: true,
          price: true,
          discount: true,
          couponAmount: true,
          quantity: true,
          variant: { select: { product: { select: { name: true } } } },
        },
      },
    },
  });

  const orders: OrderSummary[] = rawOrders.map((order) => {
    const items = order.items
      .filter((item) => item.status !== "CANCELLED")
      .map((item) => ({ productName: item.variant.product.name, revenue: lineRevenue(item) }));

    return {
      createdAt: order.createdAt.toISOString(),
      status: deriveStatus(order.items.map((item) => item.status)),
      paymentMethod: order.paymentMethod,
      customerId: order.customerId,
      orderRevenue: items.reduce((sum, item) => sum + item.revenue, 0),
      items,
    };
  });

  return (
    <>
      <PageHeader title="Analytics" description="Up to 90 days of history" />

      <PageBody>
        <AnalyticsCharts orders={orders} minDate={since.toISOString()} />
      </PageBody>
    </>
  );
}
