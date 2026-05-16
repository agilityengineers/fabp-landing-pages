import crypto from "crypto";
import fs from "fs";
import path from "path";
import { query, withClient } from "@/lib/db";
import { loadIndustry } from "@/lib/config";
import { recordEvent } from "@/lib/leads";
import { safeSyncLeadToBvi } from "@/lib/bvi-sync";

export type ApplicationData = {
  name: string;
  lastName: string;
  company: string;
  state: string;
  email: string;
  phone?: string;
  profession: string;
  city: string;
  years?: string;
  website?: string;
  spend?: string;
  fit?: string;
  industrySlug: string;
  submittedAt: string;
  variant?: "control" | "outcome" | "explicit";
  userAgent?: string;
  ipAddress?: string;
};

async function insertInvitationLead(
  data: ApplicationData,
): Promise<number | null> {
  try {
    const result = await query(
      `INSERT INTO invitation_leads
        (first_name, last_name, email, phone, company,
         profession, city, state, years, website, spend, fit,
         industry_slug, variant, user_agent, ip_address, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        data.name,
        data.lastName,
        data.email,
        data.phone ?? null,
        data.company,
        data.profession,
        data.city,
        data.state,
        data.years ?? null,
        data.website ?? null,
        data.spend ?? null,
        data.fit ?? null,
        data.industrySlug,
        data.variant ?? null,
        data.userAgent ?? null,
        data.ipAddress ?? null,
        data.submittedAt,
      ],
    );
    return result.rows[0]?.id ?? null;
  } catch (err) {
    console.error("[invitation-leads] insert failed:", err);
    return null;
  }
}

async function updateInvitationLeadBd(
  id: number,
  patch: {
    bd_status: "created" | "failed";
    bd_error?: string | null;
    bd_user_id?: string | null;
    failed_submission_id?: number | null;
  },
): Promise<void> {
  try {
    await query(
      `UPDATE invitation_leads
          SET bd_status = $1,
              bd_error = $2,
              bd_user_id = $3,
              failed_submission_id = $4,
              updated_at = NOW()
        WHERE id = $5`,
      [
        patch.bd_status,
        patch.bd_error ?? null,
        patch.bd_user_id ?? null,
        patch.failed_submission_id ?? null,
        id,
      ],
    );
  } catch (err) {
    console.error("[invitation-leads] bd-status update failed:", err);
  }
}

const BD_API_ENDPOINT = "https://www.findabusinesspro.com/api/v2/user/create";
const BD_SUBSCRIPTION_ID = "21";

/**
 * Reads the profession_id for an industry slug directly from its config file
 * at config/industries/<slug>.json (the "professionId" field).
 *
 * To add a new industry page: create config/industries/<slug>.json and set
 * "professionId" to the numeric profession_id from the Brilliant Directories
 * dashboard (BD admin → Members → Categories, or query any member in that
 * category via GET /api/v2/user/get/{id} and read the returned profession_id).
 * No changes to lib/forms.ts are required.
 */
function getProfessionId(industrySlug: string): number | undefined {
  try {
    const cfg = loadIndustry(industrySlug);
    return cfg.professionId;
  } catch {
    return undefined;
  }
}

(function assertAllSlugsHaveProfessionId() {
  try {
    const industriesDir = path.join(process.cwd(), "config", "industries");
    if (!fs.existsSync(industriesDir)) return;
    const slugs = fs
      .readdirSync(industriesDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
    const invalid: string[] = [];
    for (const slug of slugs) {
      const id = getProfessionId(slug);
      if (typeof id !== "number" || id <= 0) invalid.push(slug);
    }
    if (invalid.length > 0) {
      console.error(
        `[BD] WARNING: The following industry config files are missing a valid ` +
        `"professionId" field. Submissions from those pages will be rejected. ` +
        `Set "professionId" to the correct BD category ID in each file: ${invalid.join(", ")}`
      );
    }
  } catch {
    // Non-fatal — don't break the import if the check itself fails
  }
})();

function generateTempPassword(): string {
  return crypto.randomBytes(16).toString("base64url");
}

// `password` is hashed by BD and stored normally; BD's [*password*] merge tag
// in email templates intentionally renders the placeholder "(Entered During
// Signup)" rather than the plaintext value, so the welcome email can't surface
// it. As a workaround, we also send `temp_password` — a non-`users_data`
// column, so per BD's API docs it gets stored in `users_meta` and is exposed
// to email templates as the [*temp_password*] merge variable. The welcome
// email template references that tag to print the password to the new member.
// Do not remove either field; the form does not collect a password from the
// visitor, so the welcome email is the only path the new member has to sign in.
function buildBdFields(
  data: ApplicationData,
  tempPassword: string,
  professionId: number
): Record<string, string> {
  const fields: Record<string, string> = {
    email: data.email,
    password: tempPassword,
    temp_password: tempPassword,
    subscription_id: BD_SUBSCRIPTION_ID,
    send_email_notifications: "1",
    send_welcome_email: "1",
    first_name: data.name,
    last_name: data.lastName,
    company: data.company,
    member_type: "Service Provider",
    city: data.city,
    state: data.state,
    profession_id: String(professionId),
  };
  if (data.phone) fields.phone = data.phone;
  if (data.website) fields.website = data.website;
  if (data.profession) fields.position = data.profession;
  return fields;
}

async function logFailedSubmission(
  data: ApplicationData,
  errorDetail: string
): Promise<number | null> {
  try {
    const result = await query(
      `INSERT INTO failed_submissions
        (name, last_name, company, state, email, phone, profession, city,
         years, website, spend, fit, industry_slug, submitted_at, error_detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        data.name,
        data.lastName,
        data.company,
        data.state,
        data.email,
        data.phone ?? null,
        data.profession,
        data.city,
        data.years ?? null,
        data.website ?? null,
        data.spend ?? null,
        data.fit ?? null,
        data.industrySlug,
        data.submittedAt,
        errorDetail,
      ]
    );
    console.log("[BD] Failed submission logged to database");
    return result.rows[0]?.id ?? null;
  } catch (dbErr) {
    console.error("[BD] Failed to log submission to database:", dbErr);
    return null;
  }
}

export async function sendFailureAlert(
  applicant: { name: string; lastName: string; email: string },
  errorDetail: string
): Promise<void> {
  const fullName = `${applicant.name} ${applicant.lastName}`;
  const timestamp = new Date().toISOString();

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      "[BD] ALERT_WEBHOOK_URL is not set — skipping failure alert"
    );
    return;
  }

  const body = JSON.stringify({
    text: `⚠️ *Brilliant Directories member creation FAILED*\n• Name: ${fullName}\n• Email: ${applicant.email}\n• Error: ${errorDetail}\n• Time: ${timestamp}`,
    attachments: [
      {
        color: "danger",
        fields: [
          { title: "Name", value: fullName, short: true },
          { title: "Email", value: applicant.email, short: true },
          { title: "Error", value: errorDetail, short: false },
          { title: "Time (UTC)", value: timestamp, short: false },
        ],
      },
    ],
  });

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) {
      console.error(`[BD] Alert webhook responded with ${res.status}`);
    } else {
      console.log("[BD] Failure alert sent via webhook");
    }
  } catch (err) {
    console.error("[BD] Failed to send failure alert via webhook:", err);
  }
}

// Redact PII from an arbitrary BD response body before logging to stdout.
// BD echoes the submitted name/email back in success responses, which end up
// in deployment log aggregators if we log the raw body. We only need the
// returned user_id for ops; everything else can be summarized as a length.
function redactBdBody(text: string): string {
  if (!text) return "<empty>";
  const userId = extractBdUserId(text);
  return userId
    ? `<bd response: user_id=${userId}, ${text.length}B>`
    : `<bd response: ${text.length}B>`;
}

function extractBdUserId(text: string): string | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed.user_id === "string") return parsed.user_id;
    if (typeof parsed.user_id === "number") return String(parsed.user_id);
    if (typeof parsed.id === "string") return parsed.id;
    if (typeof parsed.id === "number") return String(parsed.id);
    const data = parsed.data as Record<string, unknown> | undefined;
    if (data && typeof data.user_id === "string") return data.user_id;
    if (data && typeof data.user_id === "number") return String(data.user_id);
  } catch {
    // BD sometimes returns non-JSON; ignore.
  }
  return null;
}

export async function submitApplication(data: ApplicationData): Promise<void> {
  // Submission log: NO PII (no name, email, phone, company). The lead is
  // persisted to invitation_leads where authorized admins can look it up.
  console.log("[FABP Application] received submission", {
    profession: data.profession,
    city: data.city,
    state: data.state,
    industrySlug: data.industrySlug,
    variant: data.variant ?? "none",
    submittedAt: data.submittedAt,
  });

  // 1) Persist the invitation lead first so admins/sales reps see it on the
  //    Invitation Leads page regardless of BD outcome. Push to BVI happens
  //    after BD so the BVI payload reflects the final BD status.
  const invitationLeadId = await insertInvitationLead(data);
  if (invitationLeadId) {
    await recordEvent("invitation", invitationLeadId, "created", {
      industry_slug: data.industrySlug,
      variant: data.variant ?? null,
    }, "system");
  }

  const apiKey = process.env.BD_API_KEY;

  async function handleBdFailure(detail: string): Promise<void> {
    const failedId = await logFailedSubmission(data, detail);
    if (invitationLeadId) {
      await updateInvitationLeadBd(invitationLeadId, {
        bd_status: "failed",
        bd_error: detail,
        failed_submission_id: failedId,
      });
      await recordEvent("invitation", invitationLeadId, "bd_failed", {
        error: detail,
        failed_submission_id: failedId,
      }, "system");
    }
    await sendFailureAlert(
      { name: data.name, lastName: data.lastName, email: data.email },
      detail,
    );
  }

  if (!apiKey) {
    const errorDetail = "BD_API_KEY not configured on the server";
    console.error("[BD] BD_API_KEY not configured — skipping member creation");
    await handleBdFailure(errorDetail);
    if (invitationLeadId) void safeSyncLeadToBvi("invitation", invitationLeadId);
    return;
  }

  const professionId = getProfessionId(data.industrySlug);

  if (typeof professionId !== "number") {
    const detail =
      `No valid professionId found for industrySlug "${data.industrySlug}". ` +
      `Ensure config/industries/${data.industrySlug}.json exists and contains a "professionId" field.`;
    console.error(`[BD] ${detail}`);
    await handleBdFailure(detail);
    if (invitationLeadId) void safeSyncLeadToBvi("invitation", invitationLeadId);
    return;
  }

  // Race-safe idempotency. Two near-simultaneous submits for the same email
  // (double-click, retry on flaky network, two open tabs) must not both
  // create a BD account, because BD would issue two different temp passwords
  // and invalidate the first welcome email. We serialize all submits for the
  // same email through a Postgres session-level advisory lock keyed on the
  // hashed lowercased email. The lock is held across the dedupe check AND
  // the BD POST, so the second submitter blocks until the first either
  // creates the account or fails — then sees the prior `bd_status='created'`
  // row in its own dedupe check and no-ops cleanly.
  //
  // hashtextextended is a stable PG hash that fits int8 — exactly what
  // pg_advisory_lock(bigint) wants. We don't care about hash collisions
  // beyond "two unrelated emails very rarely serialize together for a
  // second", which is fine.
  const emailLockKey = data.email.toLowerCase();
  await withClient(async (client) => {
    await client.query(`SELECT pg_advisory_lock(hashtextextended($1, 0))`, [
      emailLockKey,
    ]);
    try {
      const dup = await client.query(
        `SELECT id, bd_user_id
           FROM invitation_leads
          WHERE LOWER(email) = LOWER($1)
            AND bd_status = 'created'
            AND created_at > NOW() - INTERVAL '10 minutes'
            AND (id IS DISTINCT FROM $2)
          ORDER BY created_at DESC
          LIMIT 1`,
        [data.email, invitationLeadId],
      );
      if (dup.rowCount && dup.rowCount > 0) {
        const prior = dup.rows[0] as { id: number; bd_user_id: string | null };
        console.log(
          `[BD] Idempotent skip — duplicate submit for same email in last 10min ` +
            `(prior invitation_lead=${prior.id}, bd_user_id=${prior.bd_user_id ?? "?"})`,
        );
        if (invitationLeadId) {
          await updateInvitationLeadBd(invitationLeadId, {
            bd_status: "created",
            bd_user_id: prior.bd_user_id,
          });
          await recordEvent(
            "invitation",
            invitationLeadId,
            "bd_skipped_duplicate",
            { prior_lead_id: prior.id, bd_user_id: prior.bd_user_id },
            "system",
          );
        }
        return;
      }

      const tempPassword = generateTempPassword();
      const body = new URLSearchParams(
        buildBdFields(data, tempPassword, professionId),
      ).toString();

      try {
        const res = await fetch(BD_API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Api-Key": apiKey,
            "accept": "application/json",
          },
          body,
        });
        const text = await res.text();
        if (!res.ok) {
          // Persist the full response body to failed_submissions.error_detail
          // (private DB column), but only the status + redacted summary
          // reaches stdout / log aggregators.
          const errorDetailForDb = `HTTP ${res.status}: ${text}`;
          console.error(
            `[BD] Member creation failed: HTTP ${res.status} ${redactBdBody(text)}`,
          );
          await handleBdFailure(errorDetailForDb);
        } else {
          console.log("[BD] Member created successfully", redactBdBody(text));
          const bdUserId = extractBdUserId(text);
          if (invitationLeadId) {
            // Write the bd_status='created' marker on the SAME locked
            // client and HARD-FAIL on error. This is the dedupe sentinel
            // the next concurrent submit will check; if it isn't written,
            // a subsequent submit within 10 min could double-create the
            // BD account. We accept a thrown error here over a silent
            // swallow — the caller sees a 500 and an operator can
            // reconcile manually rather than discovering a duplicate.
            try {
              await client.query(
                `UPDATE invitation_leads
                    SET bd_status = 'created',
                        bd_user_id = $1,
                        bd_error = NULL,
                        failed_submission_id = NULL,
                        updated_at = NOW()
                  WHERE id = $2`,
                [bdUserId, invitationLeadId],
              );
            } catch (err) {
              console.error(
                `[BD] CRITICAL: BD account ${bdUserId ?? "?"} was created ` +
                  `but invitation_leads.bd_status update FAILED for lead ` +
                  `${invitationLeadId}. A duplicate submit within 10min could ` +
                  `create a second BD account. Manually run: UPDATE ` +
                  `invitation_leads SET bd_status='created', bd_user_id=` +
                  `'${bdUserId ?? ""}' WHERE id=${invitationLeadId};`,
                err,
              );
              // Re-throw a marker error that the OUTER catch must NOT
              // swallow — this is an invariant breach (BD created, dedupe
              // sentinel unwritten), not an ordinary BD failure. Letting
              // it propagate forces /api/applications to return 500 so an
              // operator notices and reconciles, rather than us silently
              // pretending the submit succeeded.
              const fatal = new Error(
                `BD_SENTINEL_WRITE_FAILED:lead=${invitationLeadId},bd_user_id=${bdUserId ?? "?"}`,
              );
              (fatal as Error & { __invariantBreach?: boolean }).__invariantBreach = true;
              throw fatal;
            }
            // Activity event is best-effort — it's not a dedupe sentinel
            // and a missed event row won't allow duplicate BD creates.
            try {
              await recordEvent(
                "invitation",
                invitationLeadId,
                "bd_created",
                { bd_user_id: bdUserId },
                "system",
              );
            } catch (err) {
              console.error(
                `[BD] non-fatal: lead_events insert failed for lead ${invitationLeadId}`,
                err,
              );
            }
          }
        }
      } catch (err) {
        // Never swallow an invariant breach — see the sentinel-write
        // CRITICAL log above. Let it propagate so the API responds 500
        // and an operator is forced to reconcile the orphaned BD account.
        if (
          err &&
          typeof err === "object" &&
          (err as { __invariantBreach?: boolean }).__invariantBreach
        ) {
          throw err;
        }
        const errorDetail = err instanceof Error ? err.message : String(err);
        console.error("[BD] Member creation error:", err);
        await handleBdFailure(`Network/unexpected error: ${errorDetail}`);
      }
    } finally {
      // Always release the advisory lock, even if the BD path threw.
      try {
        await client.query(
          `SELECT pg_advisory_unlock(hashtextextended($1, 0))`,
          [emailLockKey],
        );
      } catch (err) {
        console.error("[BD] Failed to release email advisory lock:", err);
      }
    }
  });

  if (invitationLeadId) void safeSyncLeadToBvi("invitation", invitationLeadId);
}

export interface FailedSubmissionRow {
  id: number;
  name: string;
  last_name: string | null;
  company: string | null;
  state: string | null;
  email: string;
  phone: string | null;
  profession: string | null;
  city: string | null;
  years: string | null;
  website: string | null;
  spend: string | null;
  fit: string | null;
  industry_slug: string | null;
  submitted_at: string | null;
  error_detail: string | null;
  created_at: string;
  status: "pending" | "resolved" | "dismissed";
  resolved_at: string | null;
  retry_count: number;
}

export async function listFailedSubmissions(
  status?: "pending" | "resolved" | "dismissed"
): Promise<FailedSubmissionRow[]> {
  const sql = status
    ? `SELECT id, name, last_name, company, state, email, phone, profession,
              city, years, website, spend, fit, industry_slug, submitted_at,
              error_detail, created_at, status, resolved_at, retry_count
       FROM failed_submissions
       WHERE status = $1
       ORDER BY created_at DESC`
    : `SELECT id, name, last_name, company, state, email, phone, profession,
              city, years, website, spend, fit, industry_slug, submitted_at,
              error_detail, created_at, status, resolved_at, retry_count
       FROM failed_submissions
       ORDER BY created_at DESC`;
  const result = status ? await query(sql, [status]) : await query(sql);
  return result.rows as FailedSubmissionRow[];
}

export async function retryFailedSubmission(id: number): Promise<void> {
  const apiKey = process.env.BD_API_KEY;
  if (!apiKey) {
    throw new Error("BD_API_KEY not configured");
  }

  // Atomically claim the row by flipping status pending → processing.
  // We hold a row-level lock with `FOR UPDATE SKIP LOCKED` so two concurrent
  // workers (auto-retry scheduler tick + admin "Retry" click, or two cron
  // pods if this ever stops being a single-VM deploy) can never both flip
  // the same row — the second worker sees zero rows and bails out cleanly
  // instead of double-posting the applicant to Brilliant Directories.
  const claimResult = await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const locked = await client.query(
        `SELECT id FROM failed_submissions
          WHERE id = $1 AND status = 'pending'
          FOR UPDATE SKIP LOCKED`,
        [id],
      );
      if (locked.rowCount === 0) {
        await client.query("ROLLBACK");
        return { rows: [], rowCount: 0 } as { rows: Record<string, unknown>[]; rowCount: number };
      }
      const res = await client.query(
        `UPDATE failed_submissions
            SET status = 'processing', retry_count = retry_count + 1
          WHERE id = $1
          RETURNING *`,
        [id],
      );
      await client.query("COMMIT");
      return res;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });

  if (claimResult.rows.length === 0) {
    throw new Error(
      `No pending failed submission found with id ${id} (may already be processing or resolved)`
    );
  }

  const row = claimResult.rows[0];
  const data: ApplicationData = {
    name: row.name,
    lastName: row.last_name,
    company: row.company,
    state: row.state,
    email: row.email,
    phone: row.phone ?? undefined,
    profession: row.profession,
    city: row.city,
    years: row.years ?? undefined,
    website: row.website ?? undefined,
    spend: row.spend ?? undefined,
    fit: row.fit ?? undefined,
    industrySlug: row.industry_slug,
    submittedAt: row.submitted_at,
  };

  // Whatever happens after the claim — fetch failure, validation failure,
  // assertion, anything — the row must NOT stay in 'processing' forever.
  // We pin it back to 'pending' (with the new error_detail) on any throw
  // so the next scheduler tick can pick it up again.
  let succeeded = false;
  let skippedAsDuplicate = false;
  let errorDetail: string | null = null;
  let responseText = "";

  try {
    const professionId = getProfessionId(data.industrySlug);
    if (typeof professionId !== "number") {
      errorDetail =
        `No valid professionId found for industrySlug "${data.industrySlug}" — cannot retry`;
    } else {
      const tempPassword = generateTempPassword();
      const body = new URLSearchParams(
        buildBdFields(data, tempPassword, professionId),
      ).toString();

      // Email-scoped idempotency for the retry path. Multiple
      // failed_submissions rows can exist for the same applicant (historical
      // duplicates, repeated submits while BD was down). Without this check,
      // the scheduler would happily POST to BD once per failed_submissions
      // row and create N duplicate BD accounts for the same applicant.
      //
      // We hold the SAME advisory lock submitApplication uses
      // (hashtextextended of lowercased email), so a retry serializes with
      // any concurrent fresh submit OR a concurrent retry of a sibling row
      // for the same applicant. Inside the lock we look for any
      // invitation_leads row with bd_status='created' for this email; if
      // found, this retry is a no-op — we mark the row resolved without
      // calling BD.
      const emailLockKey = data.email.toLowerCase();
      await withClient(async (client) => {
        await client.query(
          `SELECT pg_advisory_lock(hashtextextended($1, 0))`,
          [emailLockKey],
        );
        try {
          const dup = await client.query(
            `SELECT id, bd_user_id
               FROM invitation_leads
              WHERE LOWER(email) = LOWER($1)
                AND bd_status = 'created'
              ORDER BY created_at DESC
              LIMIT 1`,
            [data.email],
          );
          if (dup.rowCount && dup.rowCount > 0) {
            const prior = dup.rows[0] as { id: number; bd_user_id: string | null };
            console.log(
              `[BD] Retry ${id} skipped — applicant ${prior.bd_user_id ?? "?"} ` +
                `already exists in BD (invitation_lead=${prior.id}). Marking resolved.`,
            );
            skippedAsDuplicate = true;
            return;
          }

          try {
            const res = await fetch(BD_API_ENDPOINT, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Api-Key": apiKey,
                "accept": "application/json",
              },
              body,
            });
            responseText = await res.text();
            if (!res.ok) {
              errorDetail = `HTTP ${res.status}: ${responseText}`;
            } else {
              succeeded = true;
            }
          } catch (err) {
            errorDetail = `Network/unexpected error: ${err instanceof Error ? err.message : String(err)}`;
          }
        } finally {
          try {
            await client.query(
              `SELECT pg_advisory_unlock(hashtextextended($1, 0))`,
              [emailLockKey],
            );
          } catch (err) {
            console.error("[BD] Retry: failed to release email advisory lock:", err);
          }
        }
      });
    }
  } catch (err) {
    // Defensive: any unexpected throw above (e.g. config-loading exception)
    // is captured here so the cleanup branch runs.
    errorDetail = `Unexpected retry error: ${err instanceof Error ? err.message : String(err)}`;
  }

  if (skippedAsDuplicate) {
    await query(
      `UPDATE failed_submissions
       SET status = 'resolved', resolved_at = NOW(),
           error_detail = COALESCE(error_detail, '') ||
             E'\n[auto-resolved: BD account already exists for this email]'
       WHERE id = $1 AND status = 'processing'`,
      [id],
    );
    return;
  }

  if (succeeded) {
    await query(
      `UPDATE failed_submissions
       SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1 AND status = 'processing'`,
      [id],
    );
    console.log(
      `[BD] Retry for submission ${id} succeeded`,
      redactBdBody(responseText),
    );
    return;
  }

  // Persist the full error_detail (may include BD body) into the DB column
  // so admins can inspect it via the dashboard, but throw / log only a
  // redacted version so the BD body doesn't end up in stdout / external
  // log aggregators.
  const redactedDetail = errorDetail
    ? errorDetail.startsWith("HTTP ")
      ? `${errorDetail.split(":")[0]} ${redactBdBody(responseText)}`
      : errorDetail.length > 200
      ? `${errorDetail.slice(0, 200)}…`
      : errorDetail
    : "Unknown error";

  try {
    await query(
      `UPDATE failed_submissions
       SET status = 'pending', error_detail = $1
       WHERE id = $2 AND status = 'processing'`,
      [errorDetail, id],
    );
  } catch (err) {
    // Even reset failed — log loudly so an operator can manually flip the
    // row back to 'pending' before the watchdog window expires.
    console.error(
      `[BD] CRITICAL: failed_submissions row ${id} may be stuck in 'processing' ` +
        `because the cleanup UPDATE itself errored. Manually run: ` +
        `UPDATE failed_submissions SET status='pending' WHERE id=${id} AND status='processing'.`,
      err,
    );
  }
  throw new Error(redactedDetail);
}
