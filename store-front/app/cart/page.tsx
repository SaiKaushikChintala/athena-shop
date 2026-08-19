import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { type Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { SiteHeader } from "@/components/site-header";
import { PageShell, PageTitle } from "@/components/page-shell";
import { CartItemControls } from "@/components/cart-item-controls";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { formatMoney } from "@/lib/format";
import { toCents } from "@/lib/coupon";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage(): Promise<React.ReactElement> {
  const { customer, initials, cartCount } = await getHeaderData();

  const cart = await db.cart.findUnique({
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
              product: { select: { name: true, slug: true, coverImage: true } },
              optionValues: { select: { optionValue: { select: { value: true } } } },
            },
          },
        },
      },
    },
  });

  const items = cart?.items ?? [];

  const subtotal = toCents(
    items.reduce((sum, item) => sum + (item.variant.discount ?? item.variant.price).toNumber() * item.quantity, 0),
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />

      <PageShell width="narrow">
        <PageTitle
          title="Cart"
          subtitle={
            totalItems > 0
              ? `${totalItems} item${totalItems !== 1 ? "s" : ""}`
              : undefined
          }
        />

        {items.length === 0 ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBag />
              </EmptyMedia>
              <EmptyTitle>Your cart is empty</EmptyTitle>
              <EmptyDescription>
                Browse the collection and add something you like.
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
            <div className="divide-y overflow-hidden rounded-xl border">
              {items.map((item) => (
                <CartItemControls
                  key={item.variantId}
                  item={{
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.variant.price.toNumber(),
                    discount: item.variant.discount?.toNumber() ?? null,
                    coverImage: item.variant.coverImage ?? item.variant.product.coverImage,
                    productName: item.variant.product.name,
                    productSlug: item.variant.product.slug,
                    variantLabel: item.variant.optionValues.map((ov) => ov.optionValue.value).join(" / "),
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-4 rounded-xl border bg-accent/30 p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-heading text-xl font-bold tabular-nums text-foreground">
                  {formatMoney(subtotal)}
                </span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Shipping and taxes are calculated at checkout.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">
                  Proceed to checkout
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </PageShell>
    </div>
  );
}
