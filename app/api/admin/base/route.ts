import { NextRequest, NextResponse } from "next/server";
import { loadBase, saveBase } from "@/lib/config";
import { baseSchema } from "@/config/schema";
import { cookies } from "next/headers";

async function requireAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "1";
}

export async function GET() {
  const base = loadBase();
  return NextResponse.json(base);
}

export async function PATCH(req: NextRequest) {
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
