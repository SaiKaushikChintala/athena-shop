import crypto from "crypto";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-seller-session" : "seller_session";

export function verifySessionToken(token: string): { id: string } | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

  if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { id?: string; exp?: number };
    if (!data.id || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: data.id };
  } catch {
    return null;
  }
}
