import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import {
  createNote,
  getInvitationLead,
  getPlaybookLead,
  listNotes,
  recordEvent,
  type LeadType,
} from "@/lib/leads";

const ALLOWED_TYPES = new Set<LeadType>(["playbook", "invitation"]);

function parseRouteParams(p: Record<string, string>) {
  const type = p.type as LeadType;
  if (!ALLOWED_TYPES.has(type)) return null;
  const id = Number(p.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return { type, id };
}

async function leadExists(type: LeadType, id: number): Promise<boolean> {
  const lead =
    type === "playbook" ? await getPlaybookLead(id) : await getInvitationLead(id);
  return !!lead;
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
  const notes = await listNotes(parsed.type, parsed.id);
  return NextResponse.json(notes);
}

export async function POST(
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

  let body: { body?: string; author?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }
  if (text.length > 10_000) {
    return NextResponse.json(
      { error: "Note body too long (max 10,000 chars)" },
      { status: 400 },
    );
  }

  if (!(await leadExists(parsed.type, parsed.id))) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const note = await createNote(parsed.type, parsed.id, text, body.author?.trim() || "admin");
  await recordEvent(
    parsed.type,
    parsed.id,
    "note_added",
    { note_id: note.id },
    body.author?.trim() || "admin",
  );
  return NextResponse.json(note, { status: 201 });
}
