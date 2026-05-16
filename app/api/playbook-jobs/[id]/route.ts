import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { isAuthenticated } from "@/lib/auth";

async function requireAuth(): Promise<boolean> {
  return isAuthenticated();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  let row: {
    id: number;
    industry_slug: string;
    status: string;
    draft_s3_key: string | null;
    published_s3_key: string | null;
    error_message: string | null;
    notes: string | null;
    created_at: string;
    completed_at: string | null;
  } | null;
  try {
    const result = await query(
      `SELECT id, industry_slug, status, draft_s3_key, published_s3_key,
              error_message, notes, created_at, completed_at
         FROM playbook_jobs
         WHERE id = $1`,
      [numeric],
    );
    row = result.rows[0] ?? null;
  } catch (err) {
    console.error("[playbook-jobs] DB query failed:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let draftUrl: string | null = null;
  if (row.status === "ready" && row.draft_s3_key) {
    try {
      draftUrl = await getPresignedDownloadUrl(
        row.draft_s3_key,
        `playbook-${row.industry_slug}-draft.pdf`,
      );
    } catch (err) {
      console.error(
        "[playbook-jobs] presigned URL generation failed:",
        err,
      );
    }
  }

  return NextResponse.json({
    id: row.id,
    industrySlug: row.industry_slug,
    status: row.status,
    draftS3Key: row.draft_s3_key,
    publishedS3Key: row.published_s3_key,
    errorMessage: row.error_message,
    notes: row.notes,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    draftUrl,
  });
}
