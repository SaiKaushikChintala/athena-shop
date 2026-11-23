import "server-only";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import type { ZodError, ZodType } from "zod";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is not set");
}

const SALT_ROUNDS = 12;
const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const DUMMY_HASH = bcrypt.hashSync("__dummy__", SALT_ROUNDS);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function checkPassword(password: string, hash: string | null): Promise<boolean> {
  if (hash === null) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, hash);
}

function signSession(id: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ id, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export async function createSession(id: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signSession(id), { ...COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE });
}

export async function verifySession(): Promise<{ id: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ message }, { status });
}

function validationError(error: ZodError): Response {
  return Response.json(
    {
      message: "Validation failed",
      errors: error.flatten((issue) => issue.message).fieldErrors,
    },
    { status: 422 },
  );
}

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: jsonError("Invalid JSON", 400) };
  }

  const result = schema.safeParse(body);
  return result.success ? { data: result.data } : { error: validationError(result.error) };
}
