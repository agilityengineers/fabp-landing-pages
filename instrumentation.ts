const AUTO_RETRY_INTERVAL_MS = 15 * 60 * 1_000; // 15 minutes

// Secrets that must be present in production. Missing values are logged
// loudly at boot so the operator notices before a request handler fails.
// "Required" means: a feature that the live deployment depends on will
// crash or silently misbehave without it.
const REQUIRED_PROD_SECRETS = [
  "BD_API_KEY",
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "CRON_SECRET",
  "ANTHROPIC_API_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;

const RECOMMENDED_PROD_SECRETS = [
  "ADMIN_SESSION_SECRET",
  "ALERT_WEBHOOK_URL",
  "PLAYBOOK_SLACK_WEBHOOK_URL",
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "BVI_WEBHOOK_SECRET",
] as const;

function validateProductionSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  const missingRequired = REQUIRED_PROD_SECRETS.filter((k) => !process.env[k]);
  const missingRecommended = RECOMMENDED_PROD_SECRETS.filter(
    (k) => !process.env[k],
  );
  if (missingRequired.length > 0) {
    console.error(
      `[startup] FATAL: missing required production secrets: ${missingRequired.join(
        ", ",
      )}. Features depending on these will fail. Set them in the deployment ` +
        `Secrets tab before the next restart.`,
    );
  }
  if (missingRecommended.length > 0) {
    console.warn(
      `[startup] WARNING: missing recommended production secrets: ${missingRecommended.join(
        ", ",
      )}. Related features are degraded or disabled.`,
    );
  }
  if (process.env.ENABLE_BACKGROUND_RETRY === "true") {
    console.warn(
      "[startup] WARNING: ENABLE_BACKGROUND_RETRY=true in production. The in-process " +
        "retry loop will run alongside any external cron and may double-process submissions. " +
        "Prefer the /api/cron/retry-submissions HTTP cron in production.",
    );
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    validateProductionSecrets();

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
    // an orphan, because runJob() is a strictly in-process worker. The
    // deployment target is a SINGLE reserved-VM instance (see .replit and
    // replit.md "Deployment shape") precisely so this assumption holds —
    // a restart means the worker is dead, full stop.
    //
    // DO NOT switch the deployment to autoscale without first replacing
    // this with a worker-id / heartbeat check. On autoscale, a fresh
    // instance booting will mark every other instance's live jobs as
    // failed, dropping work mid-render.
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
