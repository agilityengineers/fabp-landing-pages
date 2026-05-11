import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { query } from "@/lib/db";
import { loadIndustry } from "@/lib/config";
import { generatePlaybookSlots } from "@/lib/playbook";
import { buildPlaybookHtml } from "@/lib/playbook-template";
import { renderHtmlToPdf } from "@/lib/pdf";
import { uploadPlaybook, buildPlaybookKey } from "@/lib/s3";

async function requireAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "1";
}

const requestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  notes: z.string().max(2000).optional(),
});

async function runJob(jobId: number, slug: string, notes: string) {
  try {
    const industry = loadIndustry(slug);
    const slots = await generatePlaybookSlots(industry, notes);
    const html = buildPlaybookHtml({ industry, slots });
    const pdf = await renderHtmlToPdf(html);
    const draftKey = buildPlaybookKey(
      `playbooks/drafts/${slug}-${jobId}.pdf`,
    );
    await uploadPlaybook(draftKey, pdf, "application/pdf");
    await query(
      `UPDATE playbook_jobs
         SET status = 'ready', draft_s3_key = $1, completed_at = NOW()
         WHERE id = $2`,
      [draftKey, jobId],
    );
    console.log(`[playbook-generate] job ${jobId} ready: ${draftKey}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[playbook-generate] job ${jobId} failed:`, err);
    try {
      await query(
        `UPDATE playbook_jobs
           SET status = 'failed', error_message = $1, completed_at = NOW()
           WHERE id = $2`,
        [message, jobId],
      );
    } catch (dbErr) {
      console.error(
        `[playbook-generate] failed to mark job ${jobId} as failed:`,
        dbErr,
      );
    }
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid request",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  try {
    loadIndustry(parsed.slug);
  } catch {
    return NextResponse.json({ error: "Industry not found" }, { status: 404 });
  }

  let jobId: number;
  try {
    const result = await query(
      `INSERT INTO playbook_jobs (industry_slug, status, notes)
         VALUES ($1, 'running', $2)
         RETURNING id`,
      [parsed.slug, parsed.notes ?? null],
    );
    jobId = result.rows[0].id;
  } catch (err) {
    console.error("[playbook-generate] failed to insert job row:", err);
    return NextResponse.json(
      { error: "Failed to start job" },
      { status: 500 },
    );
  }

  void runJob(jobId, parsed.slug, parsed.notes ?? "");

  return NextResponse.json({ ok: true, jobId }, { status: 202 });
}
