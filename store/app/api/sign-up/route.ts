import { z } from "zod";

import { db } from "@/lib/db";
import { createSession, hashPassword, isUniqueViolation, jsonError, parseBody } from "@/lib/server-utils";

const schema = z.object({
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters" })
    .max(30, { error: "Username must be at most 30 characters" })
    .regex(/^[a-z0-9_-]+$/, {
      error: "Username can only contain lowercase letters, numbers, hyphens, and underscores",
    }),
  businessName: z
    .string()
    .trim()
    .min(2, { error: "Business name must be at least 2 characters" })
    .max(100, { error: "Business name must be at most 100 characters" }),
  email: z.email({ error: "Enter a valid email address" }),
  password: z.string().min(8, { error: "Password must be at least 8 characters" }),
});

export async function POST(request: Request): Promise<Response> {
  const body = await parseBody(request, schema);
  if ("error" in body) return body.error;

  const { username, businessName, email, password } = body.data;

  const existing = await db.seller.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  });
  if (existing) {
    return jsonError(
      existing.email === email ? "An account with this email already exists" : "This username is already taken",
      409,
    );
  }

  try {
    const seller = await db.seller.create({
      data: { username, businessName, email, password: await hashPassword(password) },
      select: { id: true },
    });
    await createSession(seller.id);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("An account with these details already exists", 409);
    throw error;
  }
}
