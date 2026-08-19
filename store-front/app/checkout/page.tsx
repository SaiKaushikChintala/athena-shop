import { redirect } from "next/navigation";
import { type Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { PageShell, PageTitle } from "@/components/page-shell";
import { CheckoutView } from "@/components/checkout-view";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { SAVED_ADDRESS_SELECT } from "@/lib/address";
import { cartSubtotal } from "@/lib/coupon";
import { type CheckoutItem, type SavedAddress } from "@/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage(): Promise<React.ReactElement> {
  const { customer, initials, cartCount } = await getHeaderData();

  const [cart, addresses] = await Promise.all([
    db.cart.findUnique({
      where: { customerId: customer.id },
      select: {
        items: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            quantity: true,
            variantId: true,
            variant: {
              select: {
                price: true,
                discount: true,
                coverImage: true,
                product: { select: { name: true, coverImage: true, sellerId: true } },
                optionValues: { select: { optionValue: { select: { value: true } } } },
              },
            },
          },
        },
      },
    }),
    db.address.findMany({
      where: { customerId: customer.id, isSnapshot: false },
      orderBy: [{ isPrimary: "desc" }, { label: "asc" }],
      select: SAVED_ADDRESS_SELECT,
    }) satisfies Promise<SavedAddress[]>,
  ]);

  if (!cart || cart.items.length === 0) redirect("/cart");

  const subtotal = cartSubtotal(
    cart.items.map((item) => ({
      sellerId: item.variant.product.sellerId,
      quantity: item.quantity,
      price: item.variant.price,
      discount: item.variant.discount,
    })),
  );

  const items: CheckoutItem[] = cart.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: (item.variant.discount ?? item.variant.price).toNumber(),
    name: item.variant.product.name,
    label: item.variant.optionValues.map((ov) => ov.optionValue.value).join(" / "),
    image: item.variant.coverImage ?? item.variant.product.coverImage,
  }));

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />

      <PageShell>
        <PageTitle title="Checkout" subtitle="Shipping details and payment." />
        <CheckoutView
          items={items}
          subtotal={subtotal}
          defaultFirstName={customer.firstName}
          defaultLastName={customer.lastName}
          addresses={addresses}
        />
      </PageShell>
    </div>
  );
}
