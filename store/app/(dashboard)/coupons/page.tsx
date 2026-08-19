import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/page-header";
import { CouponsTable } from "@/components/coupons-table";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { type SellerCoupon } from "@/types";

export default async function CouponsPage(): Promise<React.ReactElement> {
  const seller = await getSeller();

  const raw = await db.coupon.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      percentage: true,
      minAmount: true,
      maxUses: true,
      usedCount: true,
      isActive: true,
      expiresAt: true,
    },
  });

  const coupons: SellerCoupon[] = raw.map((c) => ({
    ...c,
    percentage: c.percentage.toNumber(),
    minAmount: c.minAmount?.toNumber() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Coupons"
        description={coupons.length > 0 ? `${coupons.length} coupon${coupons.length !== 1 ? "s" : ""}` : undefined}
        action={
          <Button asChild size="sm">
            <Link href="/coupons/new">
              <Plus data-icon="inline-start" />
              New coupon
            </Link>
          </Button>
        }
      />

      <PageBody>
        <CouponsTable coupons={coupons} />
      </PageBody>
    </>
  );
}
