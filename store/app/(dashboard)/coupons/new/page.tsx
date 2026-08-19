import { PageBody, PageHeader } from "@/components/page-header";
import { CouponForm } from "@/components/coupon-form";

export default function NewCouponPage(): React.ReactElement {
  return (
    <>
      <PageHeader
        title="New coupon"
        description="Set the discount and the limits that keep it in check."
        back={{ href: "/coupons", label: "Coupons" }}
      />

      <PageBody width="form">
        <CouponForm />
      </PageBody>
    </>
  );
}
