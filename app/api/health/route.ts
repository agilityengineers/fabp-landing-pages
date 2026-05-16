import { NextResponse } from "next/server";
import { query, getPoolStats } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

type CountRow = { status: string; n: string };

async function countByStatus(table: string): Promise<Record<string, number>> {
  const result = await query(
    `SELECT status, COUNT(*)::text AS n FROM ${table} GROUP BY status`,
  );
  const out: Record<string, number> = {};
  for (const row of result.rows as CountRow[]) {
    out[row.status] = Number(row.n);
  }
  return out;
}

/**
 * Admin-only health snapshot. Surfaces:
 *   - DB connectivity + pool stats (catch leaks / starvation)
 *   - failed_submissions counts by status (pending = needs attention)
 *   - playbook_jobs counts by status (running > 0 long-term means worker wedged)
 *
 * Intended for the admin dashboard and ad-hoc curl from an operator. NOT
 * exposed to anonymous users — the response contains queue sizes that hint
 * at internal load.
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  let dbConnected = false;
  let dbError: string | null = null;
  let failedSubmissions: Record<string, number> = {};
  let playbookJobs: Record<string, number> = {};

  try {
    await query("SELECT 1");
    dbConnected = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  if (dbConnected) {
    try {
      failedSubmissions = await countByStatus("failed_submissions");
    } catch (err) {
      console.error("[health] failed_submissions count failed:", err);
    }
    try {
      playbookJobs = await countByStatus("playbook_jobs");
    } catch (err) {
      console.error("[health] playbook_jobs count failed:", err);
    }
  }

  const ok = dbConnected;
  const body = {
    ok,
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    db: {
      connected: dbConnected,
      error: dbError,
      pool: getPoolStats(),
    },
    failedSubmissions: {
      pending: failedSubmissions.pending ?? 0,
      processing: failedSubmissions.processing ?? 0,
      resolved: failedSubmissions.resolved ?? 0,
      dismissed: failedSubmissions.dismissed ?? 0,
    },
    playbookJobs: {
      running: playbookJobs.running ?? 0,
      ready: playbookJobs.ready ?? 0,
      published: playbookJobs.published ?? 0,
      failed: playbookJobs.failed ?? 0,
    },
  };

  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
