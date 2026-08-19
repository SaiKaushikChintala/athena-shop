import { z } from "zod";

import { db } from "@/lib/db";
import { checkPassword, createSession, jsonError, parseBody } from "@/lib/server-utils";

const schema = z.object({
  email: z.email({ error: "Enter a valid email address" }),
  password: z.string().min(1, { error: "Password is required" }),
});

export async function POST(request: Request): Promise<Response> {
  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;

  const { email, password } = body.data;
  const seller = await db.seller.findUnique({ where: { email }, select: { id: true, password: true } });
  const valid = await checkPassword(password, seller?.password ?? null);

  if (!seller || !valid) return jsonError("Invalid email or password", 401);

  await createSession(seller.id);
  return Response.json({ ok: true });
}
