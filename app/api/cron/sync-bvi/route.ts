/**
 * Background catch-up: re-pushes any leads whose bvi_sync_status is 'pending'
 * or 'failed'. Wire this to a Replit scheduled task (or any external cron) by
 * POSTing here with header `x-cron-secret: ${CRON_SECRET}` (or
 * `Authorization: Bearer ${CRON_SECRET}`).
 *
 * Authentication is bearer-only — there is no admin-cookie fallback. To
 * trigger a sync run from the admin dashboard, expose an admin endpoint
 * (the per-lead "Re-sync to BVI" button at
 * /api/admin/leads/[type]/[id]/sync-bvi already exists for one-off retries).
 */

import { NextRequest, NextResponse } from "next/server";
import { runBviSyncBatch } from "@/lib/bvi-sync";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron/sync-bvi] CRON_SECRET is not set — endpoint is disabled");
    return NextResponse.json(
      { error: "Cron endpoint is not configured" },
      { status: 503 },
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 25, 1), 200);
  try {
    const summary = await runBviSyncBatch(limit);
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron/sync-bvi]", err);
    return NextResponse.json({ error: "Sync batch failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Some cron platforms only support GET; support both.
  return POST(req);
}
