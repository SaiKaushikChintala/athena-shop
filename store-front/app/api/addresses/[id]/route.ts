import { db } from "@/lib/db";
import { AddressSchema } from "@/lib/address-schema";
import { jsonError, parseBody, verifySession } from "@/lib/server-utils";

type Params = { params: Promise<{ id: string }> };

function findOwnAddress(id: string, customerId: string) {
  return db.address.findFirst({
    where: { id, customerId, isSnapshot: false },
    select: { id: true, isPrimary: true },
  });
}

export async function PATCH(request: Request, { params }: Params): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await parseBody(request, AddressSchema.partial());
  if ("error" in body) return body.error;

  const own = await findOwnAddress(id, session.id);
  if (!own) return jsonError("Not found", 404);

  const { isPrimary, ...data } = body.data;

  if (data.label) {
    const clash = await db.address.findFirst({
      where: { customerId: session.id, label: data.label, NOT: { id } },
      select: { id: true },
    });
    if (clash) return jsonError(`You already have an address named "${data.label}".`, 409);
  }

  if (isPrimary === false && own.isPrimary) {
    return jsonError("Make another address the default instead.", 400);
  }

  await db.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.address.updateMany({
        where: { customerId: session.id, isPrimary: true, NOT: { id } },
        data: { isPrimary: false },
      });
    }
    await tx.address.update({
      where: { id },
      data: { ...data, ...(isPrimary ? { isPrimary: true } : {}) },
    });
  });

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const session = await verifySession();
  if (!session) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const own = await findOwnAddress(id, session.id);
  if (!own) return jsonError("Not found", 404);

  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (!own.isPrimary) return;

    const next = await tx.address.findFirst({
      where: { customerId: session.id, isSnapshot: false },
      orderBy: { label: "asc" },
      select: { id: true },
    });
    if (next) await tx.address.update({ where: { id: next.id }, data: { isPrimary: true } });
  });

  return Response.json({ ok: true });
}
