import { notFound } from "next/navigation";

import { PageBody, PageHeader } from "@/components/page-header";
import { CouponForm } from "@/components/coupon-form";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";

type Props = { params: Promise<{ id: string }> };

export default async function EditCouponPage({ params }: Props): Promise<React.ReactElement> {
  const { id } = await params;
  const seller = await getSeller();

  const coupon = await db.coupon.findFirst({
    where: { id, sellerId: seller.id },
    select: { id: true, code: true, percentage: true, minAmount: true, maxUses: true, expiresAt: true },
  });
  if (!coupon) notFound();

  return (
    <>
      <PageHeader title={coupon.code} description="Edit coupon" back={{ href: "/coupons", label: "Coupons" }} />

      <PageBody width="form">
        <CouponForm
          coupon={{
            ...coupon,
            percentage: coupon.percentage.toNumber(),
            minAmount: coupon.minAmount?.toNumber() ?? null,
            expiresAt: coupon.expiresAt?.toISOString() ?? null,
          }}
        />
      </PageBody>
    </>
  );
}
