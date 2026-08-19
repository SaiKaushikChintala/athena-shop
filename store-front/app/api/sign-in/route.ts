import { z } from "zod";

import { db } from "@/lib/db";
import { checkPassword, createSession, jsonError, parseBody } from "@/lib/server-utils";

const SignInSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }).trim().toLowerCase(),
  password: z
    .string()
    .min(1, { error: "Password is required" })
    .max(72, { error: "Password cannot exceed 72 characters" }),
});

export async function POST(request: Request): Promise<Response> {
  const body = await parseBody(request, SignInSchema);
  if ("error" in body) return body.error;

  const { email, password } = body.data;

  const customer = await db.customer.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  const passwordMatch = await checkPassword(password, customer?.password ?? null);
  if (!customer || !passwordMatch) return jsonError("Invalid credentials", 401);

  await createSession(customer.id);
  return Response.json({ message: "Signed in successfully" });
}
