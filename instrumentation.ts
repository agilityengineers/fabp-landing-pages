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

    // Stuck-job reaper: any playbook_jobs row in 'running' at boot must be
    // an orphan, because runJob() is a strictly in-process worker — if the
    // server is restarting now, that worker is dead. Mark every such row
    // 'failed' unconditionally so the admin UI stops polling it.
    // (Safe under single-worker assumption; if we ever move to multi-worker,
    // this needs a worker-id / heartbeat check instead.)
    try {
      const result = await query(
        `UPDATE playbook_jobs
            SET status = 'failed',
                error_message = COALESCE(error_message, $1),
                completed_at = NOW()
          WHERE status = 'running'
          RETURNING id`,
        [
          "Marked failed by startup reaper (server restarted while job was running).",
        ],
      );
      if (result.rowCount && result.rowCount > 0) {
        console.log(
          `[playbook-jobs] Reaper marked ${result.rowCount} orphaned job(s) as failed`,
        );
      }
    } catch (err) {
      console.error("[playbook-jobs] Stuck-job reaper failed:", err);
    }

    // Validate that every industry config has a valid professionId so
    // missing mappings are surfaced at boot, not only on the first submission.
    try {
      const { listSlugs, loadIndustry } = await import("@/lib/config");
      const slugs = listSlugs();
      const invalid: string[] = [];
      for (const slug of slugs) {
        try {
          const cfg = loadIndustry(slug);
          if (typeof cfg.professionId !== "number" || cfg.professionId <= 0) {
            invalid.push(slug);
          }
        } catch {
          invalid.push(slug);
        }
      }
      if (invalid.length > 0) {
        console.error(
          `[BD] WARNING: The following industry config files are missing a valid ` +
          `"professionId" field. Submissions from those pages will be rejected. ` +
          `Set "professionId" to the correct BD category ID in each file: ${invalid.join(", ")}`
        );
      } else {
        console.log(`[BD] All ${slugs.length} industry config(s) have a valid professionId`);
      }
    } catch (err) {
      console.error("[BD] Industry config validation failed:", err);
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
