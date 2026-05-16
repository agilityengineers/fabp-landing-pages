import { query } from "@/lib/db";
import { retryFailedSubmission, sendFailureAlert } from "@/lib/forms";

import { MAX_AUTO_RETRIES } from "@/lib/retry-config";
export { MAX_AUTO_RETRIES };
const RATE_LIMIT_DELAY_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// In-process single-flight guard: prevents a second concurrent run from
// starting if the previous one has not finished yet (e.g. slow BD API).
let running = false;

/**
 * Finds all pending failed submissions that have not yet exhausted the
 * automatic retry budget (retry_count < MAX_AUTO_RETRIES) and retries each
 * one sequentially, pausing RATE_LIMIT_DELAY_MS between calls to avoid
 * hammering the BD API.
 *
 * Submissions that reach MAX_AUTO_RETRIES are left in `pending` status with a
 * high retry_count so admins can review and act on them manually.
 *
 * Returns a summary object suitable for logging or returning from an HTTP
 * handler.
 */
export async function runAutoRetry(): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  const tag = "[auto-retry]";

  if (running) {
    console.log(`${tag} Skipping — previous run still in progress`);
    return { attempted: 0, succeeded: 0, failed: 0, skipped: 1 };
  }
  running = true;

  let attempted = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    const result = await query(
      `SELECT id, retry_count, name, last_name, email
       FROM failed_submissions
       WHERE status = 'pending' AND retry_count < $1
       ORDER BY created_at ASC`,
      [MAX_AUTO_RETRIES]
    );

    const rows = result.rows as {
      id: number;
      retry_count: number;
      name: string;
      last_name: string;
      email: string;
    }[];

    if (rows.length === 0) {
      console.log(`${tag} No eligible pending submissions found`);
      return { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
    }

    console.log(`${tag} Found ${rows.length} submission(s) to retry`);

    for (let i = 0; i < rows.length; i++) {
      const { id, retry_count, name, last_name, email } = rows[i];
      attempted++;

      try {
        await retryFailedSubmission(id);
        succeeded++;
        console.log(
          `${tag} submission ${id} succeeded (was retry_count=${retry_count})`
        );
      } catch (err) {
        failed++;
        // retryFailedSubmission already redacts the thrown error message, so
        // it's safe to surface in the scheduler log.
        const msg = err instanceof Error ? err.message : String(err);
        const newCount = retry_count + 1;
        console.warn(
          `${tag} submission ${id} failed (retry_count now ${newCount}/${MAX_AUTO_RETRIES}): ${msg}`
        );

        if (newCount >= MAX_AUTO_RETRIES) {
          console.warn(
            `${tag} submission ${id} has exhausted all ${MAX_AUTO_RETRIES} automatic retries — ` +
              `leaving in pending status for admin review`
          );
          await sendFailureAlert(
            { name, lastName: last_name, email },
            `Auto-retry exhausted: this submission has failed ${MAX_AUTO_RETRIES} times and will no longer be retried automatically. Manual action is required.\n\nLast error: ${msg}`
          );
        }
      }

      if (i < rows.length - 1) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    }

    console.log(
      `${tag} Run complete — attempted=${attempted} succeeded=${succeeded} failed=${failed}`
    );
    return { attempted, succeeded, failed, skipped: 0 };
  } finally {
    running = false;
  }
}
