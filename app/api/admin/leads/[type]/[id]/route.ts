import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import {
  INVITATION_STATUSES,
  INVITATION_STEPS,
  PLAYBOOK_STATUSES,
  getInvitationLead,
  getPlaybookLead,
  listEvents,
  listNotes,
  listBviAttempts,
  recordEvent,
  softDeleteLead,
  updateInvitationLead,
  updatePlaybookLead,
  type LeadType,
} from "@/lib/leads";

const ALLOWED_TYPES = new Set<LeadType>(["playbook", "invitation"]);

function parseRouteParams(
  params: Record<string, string>,
): { type: LeadType; id: number } | null {
  const type = params.type as LeadType;
  if (!ALLOWED_TYPES.has(type)) return null;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return { type, id };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = parseRouteParams(await params);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid lead reference" }, { status: 400 });
  }

  try {
    const lead =
      parsed.type === "playbook"
        ? await getPlaybookLead(parsed.id)
        : await getInvitationLead(parsed.id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    const [notes, events, bviAttempts] = await Promise.all([
      listNotes(parsed.type, parsed.id),
      listEvents(parsed.type, parsed.id),
      listBviAttempts(parsed.type, parsed.id),
    ]);
    return NextResponse.json({
      lead: { ...lead, lead_type: parsed.type },
      notes,
      events,
      bviAttempts,
    });
  } catch (err) {
    console.error("[admin/leads:get]", err);
    return NextResponse.json({ error: "Failed to load lead" }, { status: 500 });
  }
}

const PLAYBOOK_PATCH_KEYS = ["status", "assigned_to"] as const;
const INVITATION_PATCH_KEYS = [
  "status",
  "invitation_step",
  "interview_scheduled_at",
  "listing_published_at",
  "assigned_to",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = parseRouteParams(await params);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid lead reference" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (parsed.type === "playbook") {
    for (const key of PLAYBOOK_PATCH_KEYS) {
      if (key in body) patch[key] = body[key];
    }
    if (
      patch.status !== undefined &&
      !PLAYBOOK_STATUSES.includes(patch.status as never)
    ) {
      return NextResponse.json(
        { error: `status must be one of: ${PLAYBOOK_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
  } else {
    for (const key of INVITATION_PATCH_KEYS) {
      if (key in body) patch[key] = body[key];
    }
    if (
      patch.status !== undefined &&
      !INVITATION_STATUSES.includes(patch.status as never)
    ) {
      return NextResponse.json(
        { error: `status must be one of: ${INVITATION_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    if (
      patch.invitation_step !== undefined &&
      !INVITATION_STEPS.includes(patch.invitation_step as never)
    ) {
      return NextResponse.json(
        { error: `invitation_step must be one of: ${INVITATION_STEPS.join(", ")}` },
        { status: 400 },
      );
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updatable fields in body" }, { status: 400 });
  }

  try {
    const updated =
      parsed.type === "playbook"
        ? await updatePlaybookLead(parsed.id, patch)
        : await updateInvitationLead(parsed.id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    await recordEvent(parsed.type, parsed.id, "updated", patch, "admin");
    return NextResponse.json({ ok: true, lead: { ...updated, lead_type: parsed.type } });
  } catch (err) {
    console.error("[admin/leads:patch]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = parseRouteParams(await params);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid lead reference" }, { status: 400 });
  }
  try {
    const ok = await softDeleteLead(parsed.type, parsed.id);
    if (!ok) {
      return NextResponse.json(
        { error: "Lead not found or already deleted" },
        { status: 404 },
      );
    }
    await recordEvent(parsed.type, parsed.id, "deleted", undefined, "admin");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/leads:delete]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
