import { z } from "zod";

import { Prisma } from "@/.generated/prisma/client";
import { db } from "@/lib/db";
import { createSession, hashPassword, jsonError, parseBody } from "@/lib/server-utils";

const SignUpSchema = z.object({
  firstName: z.string().min(1, { error: "First name is required" }).trim(),
  lastName: z.string().min(1, { error: "Last name is required" }).trim(),
  email: z.email({ error: "Please enter a valid email address." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(72, { error: "Password cannot exceed 72 characters" })
    .regex(/[A-Za-z]/, { error: "Password must include at least one letter" })
    .regex(/\d/, { error: "Password must include at least one number" }),
});

export async function POST(request: Request): Promise<Response> {
  const body = await parseBody(request, SignUpSchema);
  if ("error" in body) return body.error;

  const { firstName, lastName, email, password } = body.data;

  try {
    const customer = await db.customer.create({
      data: { firstName, lastName, email, password: await hashPassword(password), cart: { create: {} } },
      select: { id: true },
    });

    await createSession(customer.id);
    return Response.json({ message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("Email already in use", 409);
    }
    throw error;
  }
}
