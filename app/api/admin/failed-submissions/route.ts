import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { query } from "@/lib/db";
import { retryFailedSubmission, listFailedSubmissions } from "@/lib/forms";

const ALLOWED_STATUSES = ["pending", "resolved", "dismissed"] as const;
type Status = (typeof ALLOWED_STATUSES)[number];

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

  const validStatus: Status | null =
    statusParam && (ALLOWED_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as Status)
      : null;

  const rows = await listFailedSubmissions(validStatus ?? undefined);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action } = body;

  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json(
      { error: "id must be a positive integer" },
      { status: 400 }
    );
  }

  const ALLOWED_ACTIONS = ["retry", "dismiss"] as const;
  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "action must be one of: retry, dismiss" },
      { status: 400 }
    );
  }

  if (action === "retry") {
    try {
      await retryFailedSubmission(numericId);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[admin] Retry failed for submission ${numericId}:`, err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "dismiss") {
    const result = await query(
      `UPDATE failed_submissions
       SET status = 'dismissed', resolved_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [numericId]
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "No pending submission found with that id" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  }
}
