import { NextRequest, NextResponse } from "next/server";
import { runAutoRetry } from "@/lib/retry-scheduler";

/**
 * GET /api/cron/retry-submissions
 *
 * Triggered by an external cron service (e.g. Vercel Cron, Replit scheduler,
 * or any HTTP cron) every 15 minutes to automatically retry failed BD member
 * creation submissions.
 *
 * Protected by a shared secret: the caller must supply either
 *   Authorization: Bearer <CRON_SECRET>
 * or
 *   x-cron-secret: <CRON_SECRET>
 * where CRON_SECRET is set in the environment.  If the variable is not
 * configured the endpoint is disabled so it cannot be called at all.
 */
function authorized(req: NextRequest, secret: string): boolean {
  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error(
      "[cron] CRON_SECRET is not set — retry-submissions endpoint is disabled"
    );
    return NextResponse.json(
      { error: "Cron endpoint is not configured" },
      { status: 503 }
    );
  }

  if (!authorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runAutoRetry();
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron] Auto-retry run threw unexpectedly:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
