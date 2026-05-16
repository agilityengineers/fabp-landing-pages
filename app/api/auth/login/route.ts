import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  createSessionToken,
} from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Throttle login attempts per IP — slows brute-force guessing.
  const limit = rateLimit(req, "login", 10, 60_000);
  if (!limit.ok) return rateLimitResponse(limit);

  let password: unknown;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  let token: string;
  try {
    token = createSessionToken();
  } catch (err) {
    console.error("[auth/login] cannot issue session:", err);
    return NextResponse.json(
      { error: "Server is not configured for authentication" },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
