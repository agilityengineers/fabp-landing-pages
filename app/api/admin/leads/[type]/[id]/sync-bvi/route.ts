import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import type { LeadType } from "@/lib/leads";
import { syncLeadToBvi } from "@/lib/bvi-sync";

const ALLOWED_TYPES = new Set<LeadType>(["playbook", "invitation"]);

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const p = await params;
  const type = p.type as LeadType;
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid lead type" }, { status: 400 });
  }
  const id = Number(p.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  const result = await syncLeadToBvi(type, id, "admin");
  if (!result.ok) {
    return NextResponse.json(result, {
      status: result.status === "skipped" ? 409 : 502,
    });
  }
  return NextResponse.json(result);
}
