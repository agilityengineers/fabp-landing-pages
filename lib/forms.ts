import crypto from "crypto";
import { Resend } from "resend";
import { query, withClient } from "@/lib/db";

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

function generateTempPassword(): string {
  return crypto.randomBytes(16).toString("base64url");
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

async function sendFailureAlert(
  applicant: { name: string; lastName: string; email: string },
  errorDetail: string
): Promise<void> {
  const fullName = `${applicant.name} ${applicant.lastName}`;
  const timestamp = new Date().toISOString();

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  const alertEmail = process.env.ALERT_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!webhookUrl && !alertEmail) {
    console.warn(
      "[BD] Neither ALERT_WEBHOOK_URL nor ALERT_EMAIL is set — skipping failure alert"
    );
    return;
  }

  const alerts: Promise<void>[] = [];

  if (webhookUrl) {
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

    alerts.push(
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
        .then((res) => {
          if (!res.ok) {
            console.error(`[BD] Alert webhook responded with ${res.status}`);
          } else {
            console.log("[BD] Failure alert sent via webhook");
          }
        })
        .catch((err) => {
          console.error("[BD] Failed to send failure alert via webhook:", err);
        })
    );
  }

  if (alertEmail) {
    if (!resendApiKey) {
      console.warn(
        "[BD] ALERT_EMAIL is set but RESEND_API_KEY is missing — skipping email alert"
      );
    } else {
      const fromAddress =
        process.env.ALERT_EMAIL_FROM ?? "alerts@findabusinesspro.com";

      if (!process.env.ALERT_EMAIL_FROM) {
        console.warn(
          "[BD] ALERT_EMAIL_FROM is not set — using default sender alerts@findabusinesspro.com. " +
            "This domain must be verified in Resend or emails will fail to deliver."
        );
      }

      const resend = new Resend(resendApiKey);

      const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const htmlBody = `
        <h2>&#9888;&#65039; Brilliant Directories Member Creation Failed</h2>
        <table>
          <tr><td><strong>Name</strong></td><td>${esc(fullName)}</td></tr>
          <tr><td><strong>Applicant Email</strong></td><td>${esc(applicant.email)}</td></tr>
          <tr><td><strong>Error</strong></td><td>${esc(errorDetail)}</td></tr>
          <tr><td><strong>Time (UTC)</strong></td><td>${esc(timestamp)}</td></tr>
        </table>
      `;

      alerts.push(
        resend.emails
          .send({
            from: fromAddress,
            to: alertEmail,
            subject: `[FABP] Member creation failed for ${esc(fullName)}`,
            html: htmlBody,
          })
          .then((result) => {
            if (result.error) {
              console.error(
                "[BD] Failed to send failure alert via email:",
                result.error
              );
            } else {
              console.log("[BD] Failure alert sent via email");
            }
          })
          .catch((err) => {
            console.error("[BD] Failed to send failure alert via email:", err);
          })
      );
    }
  }

  await Promise.all(alerts);
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

  const tempPassword = generateTempPassword();

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
  };

  if (data.phone) fields.phone = data.phone;
  if (data.website) fields.website = data.website;
  if (data.profession) fields.industry = data.profession;

  const body = new URLSearchParams(fields).toString();

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

  const tempPassword = generateTempPassword();
  const fields: Record<string, string> = {
    email: data.email,
    password: tempPassword,
    subscription_id: BD_SUBSCRIPTION_ID,
    send_email_notifications: "1",
    send_welcome_email: "1",
    first_name: data.name,
    last_name: data.lastName,
    company: data.company,
    city: data.city,
    state: data.state,
    member_type: "Service Provider",
  };
  if (data.phone) fields.phone = data.phone;
  if (data.website) fields.website = data.website;
  if (data.profession) fields.industry = data.profession;

  const body = new URLSearchParams(fields).toString();

  let succeeded = false;
  let errorDetail: string | null = null;
  let responseText = "";

  try {
    const res = await fetch(BD_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Api-Key": apiKey,
        accept: "application/json",
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
<<<<<<< HEAD
=======
    // Roll the row back to pending so it can be retried again later.
>>>>>>> 71f3e96 (feat: log failed BD member creations to database for admin recovery)
    await query(
      `UPDATE failed_submissions
       SET status = 'pending', error_detail = $1
       WHERE id = $2`,
      [errorDetail, id]
    );
    throw new Error(errorDetail!);
  }
}
