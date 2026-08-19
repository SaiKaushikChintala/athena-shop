import { RotateCcw } from "lucide-react";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";
import { ReturnsList } from "@/components/returns-list";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { lineRevenue } from "@/lib/revenue";
import { type SellerReturn } from "@/types";

export default async function ReturnsPage(): Promise<React.ReactElement> {
  const seller = await getSeller();
  const mine = { orderItem: { sellerId: seller.id } };

  const raw = await db.returnRequest.findMany({
    where: { items: { some: mine } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      reason: true,
      status: true,
      refundAmount: true,
      createdAt: true,
      order: {
        select: { id: true, orderNumber: true, customer: { select: { firstName: true, lastName: true } } },
      },
      items: {
        where: mine,
        select: {
          id: true,
          quantity: true,
          orderItem: {
            select: {
              price: true,
              discount: true,
              couponAmount: true,
              quantity: true,
              variant: {
                select: {
                  product: { select: { name: true } },
                  optionValues: { select: { optionValue: { select: { value: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  const returns: SellerReturn[] = raw.map((r) => ({
    id: r.id,
    orderId: r.order.id,
    orderNumber: r.order.orderNumber,
    reason: r.reason,
    status: r.status,
    refundAmount: r.refundAmount?.toNumber() ?? null,
    createdAt: r.createdAt.toISOString(),
    customerName: `${r.order.customer.firstName} ${r.order.customer.lastName}`,
    items: r.items.map((item) => ({
      id: item.id,
      productName: item.orderItem.variant.product.name,
      variantLabel: item.orderItem.variant.optionValues.map((ov) => ov.optionValue.value).join(" / "),
      quantity: item.quantity,
    })),
    eligibleTotal:
      Math.round(
        r.items.reduce(
          (sum, item) => sum + (lineRevenue(item.orderItem) / item.orderItem.quantity) * item.quantity,
          0,
        ) * 100,
      ) / 100,
  }));

  const pending = returns.filter((r) => r.status === "PENDING").length;
  const summary = `${returns.length} request${returns.length !== 1 ? "s" : ""}`;

  return (
    <>
      <PageHeader
        title="Returns"
        description={
          returns.length > 0 ? `${summary}${pending > 0 ? ` · ${pending} awaiting review` : ""}` : undefined
        }
      />

      <PageBody>
        {returns.length === 0 ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RotateCcw />
              </EmptyMedia>
              <EmptyTitle>No return requests</EmptyTitle>
              <EmptyDescription>
                When a customer asks to return something from one of your orders, it lands here for review.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ReturnsList returns={returns} />
        )}
      </PageBody>
    </>
  );
}
