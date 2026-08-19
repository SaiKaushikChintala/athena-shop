import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/server-utils";

export const getSeller = cache(async (): Promise<{ id: string; businessName: string }> => {
  const session = await verifySession();
  if (!session) redirect("/sign-in");

  const seller = await db.seller.findUnique({
    where: { id: session.id },
    select: { id: true, businessName: true },
  });

  if (!seller) redirect("/api/session-expired");
  return seller;
});
