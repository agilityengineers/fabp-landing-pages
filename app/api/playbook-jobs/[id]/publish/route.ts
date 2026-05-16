import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { loadIndustry, saveIndustry } from "@/lib/config";
import { copyObject, buildPlaybookKey } from "@/lib/s3";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

async function requireAuth(): Promise<boolean> {
  return isAuthenticated();
}

function timestampSuffix(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const result = await query(
    `SELECT id, industry_slug, status, draft_s3_key
       FROM playbook_jobs
       WHERE id = $1`,
    [numeric],
  );
  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (row.status !== "ready" || !row.draft_s3_key) {
    return NextResponse.json(
      { error: `Job is in status "${row.status}" — cannot publish` },
      { status: 409 },
    );
  }

  let industry;
  try {
    industry = loadIndustry(row.industry_slug);
  } catch {
    return NextResponse.json(
      { error: "Industry config no longer exists" },
      { status: 404 },
    );
  }

  const publishedKey = buildPlaybookKey(
    `playbooks/${row.industry_slug}-${timestampSuffix()}.pdf`,
  );

  try {
    await copyObject(row.draft_s3_key, publishedKey);
  } catch (err) {
    console.error("[playbook-publish] S3 copy failed:", err);
    return NextResponse.json(
      {
        error: "Publish failed during S3 copy",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  const updated = {
    ...industry,
    playbook: {
      s3Key: publishedKey,
      fileName: `FABP-Provider-Playbook-${industry.slug}.pdf`,
      updatedAt: new Date().toISOString(),
      source: "generated" as const,
    },
  };
  saveIndustry(industry.slug, updated);

  try {
    await query(
      `UPDATE playbook_jobs
         SET status = 'published', published_s3_key = $1, completed_at = NOW()
         WHERE id = $2`,
      [publishedKey, numeric],
    );
  } catch (err) {
    console.error("[playbook-publish] failed to mark job published:", err);
  }

  return NextResponse.json({
    ok: true,
    publishedS3Key: publishedKey,
    playbook: updated.playbook,
  });
}
