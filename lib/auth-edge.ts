/**
 * Edge-runtime session token verifier. Mirrors verifySessionToken() in
 * lib/auth.ts but uses Web Crypto so it can run inside Next.js middleware.
 *
 * Keep the token format and secret-resolution rules in sync with lib/auth.ts.
 */

const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000; // 7 days

function getSessionSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  const fallback = process.env.ADMIN_PASSWORD;
  if (fallback && fallback.length >= 8) return fallback;
  if (process.env.NODE_ENV === "production") return null;
  return "dev-only-do-not-use";
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function verifySessionTokenEdge(
  raw: string | undefined | null,
): Promise<boolean> {
  if (!raw) return false;
  const secret = getSessionSecret();
  if (!secret) return false;
  const dot = raw.indexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return false;
  const issuedAt = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!/^\d+$/.test(issuedAt) || !/^[0-9a-f]+$/i.test(sig)) return false;
  const expected = await hmacSha256Hex(secret, issuedAt);
  if (!constantTimeEqualHex(sig.toLowerCase(), expected)) return false;
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;
  return true;
}
