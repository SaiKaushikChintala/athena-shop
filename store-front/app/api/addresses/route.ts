import { db } from "@/lib/db";
import { AddressSchema } from "@/lib/address-schema";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

export async function POST(request: Request): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await parseBody(request, AddressSchema);
  if ("error" in body) return body.error;

  const { isPrimary, ...data } = body.data;

  const existing = await db.address.findUnique({
    where: { customerId_label: { customerId: session.id, label: data.label } },
    select: { id: true },
  });
  if (existing) return jsonError(`You already have an address named "${data.label}".`, 409);

  const address = await db.$transaction(async (tx) => {
    const saved = await tx.address.count({ where: { customerId: session.id, isSnapshot: false } });
    const makePrimary = isPrimary === true || saved === 0;

    if (makePrimary) {
      await tx.address.updateMany({
        where: { customerId: session.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return tx.address.create({
      data: { ...data, isPrimary: makePrimary, customerId: session.id },
      select: { id: true, label: true },
    });
  });

  return Response.json(address, { status: 201 });
}
