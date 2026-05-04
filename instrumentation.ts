const AUTO_RETRY_INTERVAL_MS = 15 * 60 * 1_000; // 15 minutes

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { query } = await import("@/lib/db");
    const { readFileSync } = await import("fs");
    const { join } = await import("path");

    try {
      const sql = readFileSync(join(process.cwd(), "db/schema.sql"), "utf-8");
      await query(sql);
      console.log("[DB] Schema initialised successfully");
    } catch (err) {
      console.error("[DB] Schema initialisation failed:", err);
    }

    // Start the in-process background retry loop only when explicitly opted
    // in via the ENABLE_BACKGROUND_RETRY=true env var.  In production (or
    // when an external HTTP cron hits /api/cron/retry-submissions) leave this
    // disabled so both mechanisms don't run concurrently.
    if (process.env.ENABLE_BACKGROUND_RETRY === "true") {
      const startAutoRetryLoop = async () => {
        const { runAutoRetry } = await import("@/lib/retry-scheduler");

        const tick = async () => {
          try {
            await runAutoRetry();
          } catch (err) {
            console.error("[auto-retry] Unexpected error during scheduled run:", err);
          }
        };

        console.log(
          `[auto-retry] Background scheduler started — will retry failed submissions every ` +
            `${AUTO_RETRY_INTERVAL_MS / 60_000} minutes`
        );

        setInterval(tick, AUTO_RETRY_INTERVAL_MS);
      };

      startAutoRetryLoop().catch((err) => {
        console.error("[auto-retry] Failed to start background scheduler:", err);
      });
    }
  }
}
