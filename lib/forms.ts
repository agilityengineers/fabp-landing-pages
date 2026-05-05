import crypto from "crypto";
import fs from "fs";
import path from "path";
import { query, withClient } from "@/lib/db";
import { loadIndustry } from "@/lib/config";

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
};

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

// The `password` field below is rendered to new members by BD's welcome email
// template (via its password merge variable). Do not remove it — visitors do
// not choose a password on the form, so the email is their only way in.
function buildBdFields(
  data: ApplicationData,
  tempPassword: string,
  professionId: number
): Record<string, string> {
  const fields: Record<string, string> = {
    email: data.email,
    password: tempPassword,
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
): Promise<void> {
  try {
    await query(
      `INSERT INTO failed_submissions
        (name, last_name, company, state, email, phone, profession, city,
         years, website, spend, fit, industry_slug, submitted_at, error_detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
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
  } catch (dbErr) {
    console.error("[BD] Failed to log submission to database:", dbErr);
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

export async function submitApplication(data: ApplicationData): Promise<void> {
  console.log("[FABP Application] received submission", {
    profession: data.profession,
    city: data.city,
    state: data.state,
    industrySlug: data.industrySlug,
    submittedAt: data.submittedAt,
  });

  const apiKey = process.env.BD_API_KEY;

  if (!apiKey) {
    const errorDetail = "BD_API_KEY not configured on the server";
    console.error("[BD] BD_API_KEY not configured — skipping member creation");
    await Promise.all([
      logFailedSubmission(data, errorDetail),
      sendFailureAlert(
        { name: data.name, lastName: data.lastName, email: data.email },
        errorDetail
      ),
    ]);
    return;
  }

  const professionId = getProfessionId(data.industrySlug);

  if (typeof professionId !== "number") {
    const detail =
      `No valid professionId found for industrySlug "${data.industrySlug}". ` +
      `Ensure config/industries/${data.industrySlug}.json exists and contains a "professionId" field.`;
    console.error(`[BD] ${detail}`);
    await Promise.all([
      logFailedSubmission(data, detail),
      sendFailureAlert(
        { name: data.name, lastName: data.lastName, email: data.email },
        detail
      ),
    ]);
    return;
  }

  const tempPassword = generateTempPassword();
  const body = new URLSearchParams(
    buildBdFields(data, tempPassword, professionId)
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
      const errorDetail = `HTTP ${res.status}: ${text}`;
      console.error(`[BD] Member creation failed: ${errorDetail}`);
      await Promise.all([
        logFailedSubmission(data, errorDetail),
        sendFailureAlert(
          { name: data.name, lastName: data.lastName, email: data.email },
          errorDetail
        ),
      ]);
    } else {
      console.log("[BD] Member created successfully", text);
    }
  } catch (err) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    console.error("[BD] Member creation error:", err);
    await Promise.all([
      logFailedSubmission(data, `Network/unexpected error: ${errorDetail}`),
      sendFailureAlert(
        { name: data.name, lastName: data.lastName, email: data.email },
        `Network/unexpected error: ${errorDetail}`
      ),
    ]);
  }
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
  // If another request already claimed it, this returns no rows and we bail.
  const claimResult = await withClient(async (client) => {
    await client.query("BEGIN");
    const res = await client.query(
      `UPDATE failed_submissions
       SET status = 'processing', retry_count = retry_count + 1
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );
    await client.query("COMMIT");
    return res;
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

  const professionId = getProfessionId(data.industrySlug);
  if (typeof professionId !== "number") {
    throw new Error(
      `No valid professionId found for industrySlug "${data.industrySlug}" — cannot retry`
    );
  }

  const tempPassword = generateTempPassword();
  const body = new URLSearchParams(
    buildBdFields(data, tempPassword, professionId)
  ).toString();

  let succeeded = false;
  let errorDetail: string | null = null;
  let responseText = "";

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

  if (succeeded) {
    await query(
      `UPDATE failed_submissions
       SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1`,
      [id]
    );
    console.log(`[BD] Retry for submission ${id} succeeded`, responseText);
  } else {
    // Roll the row back to pending so it can be retried again later.
    await query(
      `UPDATE failed_submissions
       SET status = 'pending', error_detail = $1
       WHERE id = $2`,
      [errorDetail, id]
    );
    throw new Error(errorDetail!);
  }
}
