import { PageBody, PageHeader } from "@/components/page-header";
import { OrdersTable } from "@/components/orders-table";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { sumRevenue } from "@/lib/revenue";
import { deriveStatus } from "@/lib/fulfilment";
import { type SellerOrder } from "@/types";

export default async function OrdersPage(): Promise<React.ReactElement> {
  const seller = await getSeller();

  const raw = await db.order.findMany({
    where: { items: { some: { sellerId: seller.id } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      paymentMethod: true,
      paymentStatus: true,
      createdAt: true,
      customer: { select: { firstName: true, lastName: true, email: true } },
      items: {
        where: { sellerId: seller.id },
        select: { status: true, quantity: true, price: true, discount: true, couponAmount: true },
      },
    },
  });

  const orders: SellerOrder[] = raw.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: deriveStatus(order.items.map((item) => item.status)),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
    customer: order.customer,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    sellerTotal: sumRevenue(order.items.filter((item) => item.status !== "CANCELLED")),
  }));

  return (
    <>
      <PageHeader
        title="Orders"
        description={
          orders.length > 0
            ? `${orders.length} order${orders.length !== 1 ? "s" : ""} containing your products`
            : undefined
        }
      />

      <PageBody>
        <OrdersTable orders={orders} />
      </PageBody>
    </>
  );
}
