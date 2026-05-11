import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  deleteNote,
  recordEvent,
  updateNote,
  type LeadType,
} from "@/lib/leads";

const ALLOWED_TYPES = new Set<LeadType>(["playbook", "invitation"]);

function parseRouteParams(p: Record<string, string>) {
  const type = p.type as LeadType;
  if (!ALLOWED_TYPES.has(type)) return null;
  const id = Number(p.id);
  const noteId = Number(p.noteId);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!Number.isInteger(noteId) || noteId <= 0) return null;
  return { type, id, noteId };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string; noteId: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = parseRouteParams(await params);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  let body: { body?: string };
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

  const note = await updateNote(parsed.noteId, text);
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
  if (note.lead_type !== parsed.type || note.lead_id !== parsed.id) {
    return NextResponse.json(
      { error: "Note does not belong to that lead" },
      { status: 400 },
    );
  }
  await recordEvent(
    parsed.type,
    parsed.id,
    "note_updated",
    { note_id: note.id },
    "admin",
  );
  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string; noteId: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = parseRouteParams(await params);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  const ok = await deleteNote(parsed.noteId);
  if (!ok) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
  await recordEvent(
    parsed.type,
    parsed.id,
    "note_deleted",
    { note_id: parsed.noteId },
    "admin",
  );
  return NextResponse.json({ ok: true });
}
