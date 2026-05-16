import { NextRequest, NextResponse } from "next/server";
import { loadBase, saveBase } from "@/lib/config";
import { baseSchema } from "@/config/schema";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

async function requireAuth() {
  return isAuthenticated();
}

export async function GET() {
  const base = loadBase();
  return NextResponse.json(base);
}

export async function PATCH(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  try {
    const validated = baseSchema.parse(body);
    saveBase(validated);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }
}
