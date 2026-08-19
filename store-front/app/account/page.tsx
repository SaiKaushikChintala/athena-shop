import Link from "next/link";
import { type Metadata } from "next";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";
import { AddressBook } from "@/components/address-book";
import { PageShell, PageTitle, SectionLabel } from "@/components/page-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/dal";
import { SAVED_ADDRESS_SELECT } from "@/lib/address";
import { type SavedAddress } from "@/types";

export const metadata: Metadata = {
  title: "Account",
  description: "Your profile and account settings.",
};

export default async function AccountPage(): Promise<React.ReactElement> {
  const { customer, initials, cartCount } = await getHeaderData();

  const addresses: SavedAddress[] = await db.address.findMany({
    where: { customerId: customer.id, isSnapshot: false },
    orderBy: [{ isPrimary: "desc" }, { label: "asc" }],
    select: SAVED_ADDRESS_SELECT,
  });

  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(customer.createdAt));

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader initials={initials} cartCount={cartCount} />

      <PageShell width="narrow">
        <PageTitle title="Account" subtitle="Your profile and sign-in details." />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-lg font-black tracking-tight text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold leading-snug text-foreground">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {customer.email}
                </p>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4">
            <dl className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <dt className="eyebrow">Member since</dt>
                <dd className="text-sm font-medium text-foreground">{memberSince}</dd>
              </div>
            </dl>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Link
              href="/orders"
              className="inline-flex h-9 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              My orders
            </Link>
            <SignOutButton />
          </CardFooter>
        </Card>

        <section className="flex flex-col gap-3">
          <SectionLabel>Saved addresses</SectionLabel>
          <AddressBook
            addresses={addresses}
            defaultFirstName={customer.firstName}
            defaultLastName={customer.lastName}
          />
        </section>
      </PageShell>
    </div>
  );
}
