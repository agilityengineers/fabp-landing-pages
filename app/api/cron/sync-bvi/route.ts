/**
 * Background catch-up: re-pushes any leads whose bvi_sync_status is 'pending'
 * or 'failed'. Wire this to a Replit scheduled task (or any external cron) by
 * POSTing here with header `x-cron-secret: ${CRON_SECRET}`.
 *
 * If CRON_SECRET is unset, the route falls back to the admin auth cookie so
 * humans can fire it from the dashboard during testing without setting up a
 * secret.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runBviSyncBatch } from "@/lib/bvi-sync";

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided && provided === secret) return true;
  }
  return await isAuthenticated();
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) {
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
