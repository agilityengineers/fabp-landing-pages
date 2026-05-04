import { cookies } from "next/headers";

export const COOKIE_NAME = "admin-auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value === "1";
}

export async function setAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
    return input === "admin";
  }
  return input === adminPassword;
}
