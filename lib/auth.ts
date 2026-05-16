import { cookies } from "next/headers";
import crypto from "crypto";

export const COOKIE_NAME = "admin-auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SESSION_MAX_AGE_MS = COOKIE_MAX_AGE * 1000;

/**
 * Session secret resolution order:
 *   1. ADMIN_SESSION_SECRET (preferred — set this in production)
 *   2. ADMIN_PASSWORD       (fallback so existing deploys keep working;
 *                            using the admin password as session secret is
 *                            acceptable because anyone who knows it can log
 *                            in anyway)
 *   3. "dev-only-do-not-use" — only honored when NODE_ENV !== "production".
 *      In production, returning null forces verification to fail.
 */
function getSessionSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  const fallback = process.env.ADMIN_PASSWORD;
  if (fallback && fallback.length >= 8) return fallback;
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return "dev-only-do-not-use";
}

function constantTimeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      "Refusing to issue session: no ADMIN_SESSION_SECRET or ADMIN_PASSWORD set in production"
    );
  }
  const issuedAt = Date.now().toString();
  const sig = crypto.createHmac("sha256", secret).update(issuedAt).digest("hex");
  return `${issuedAt}.${sig}`;
}

export function verifySessionToken(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const secret = getSessionSecret();
  if (!secret) return false;
  const dot = raw.indexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return false;
  const issuedAt = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!/^\d+$/.test(issuedAt) || !/^[0-9a-f]+$/i.test(sig)) return false;
  const expected = crypto.createHmac("sha256", secret).update(issuedAt).digest("hex");
  if (!constantTimeEqualStr(sig, expected)) return false;
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;
  return true;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return verifySessionToken(cookie?.value);
}

export async function setAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function checkPassword(input: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "ADMIN_PASSWORD is not set in production — refusing to authenticate. Set the env var on Replit."
      );
      return false;
    }
    console.warn("ADMIN_PASSWORD not set — using default dev password");
    return constantTimeEqualStr(input ?? "", "admin");
  }
  return constantTimeEqualStr(input ?? "", adminPassword);
}
