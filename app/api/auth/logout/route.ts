import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
