import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/server-utils";

const getCustomer = cache(async () => {
  const session = await verifySession();
  if (!session) redirect("/sign-in");

  const customer = await db.customer.findUnique({
    where: { id: session.id },
    select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
  });

  if (!customer) redirect("/api/session-expired");
  return customer;
});

export const getHeaderData = cache(async () => {
  const customer = await getCustomer();

  const cart = await db.cart.findUnique({
    where: { customerId: customer.id },
    select: { items: { select: { quantity: true } } },
  });

  return {
    customer,
    initials: `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase(),
    cartCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  };
});
