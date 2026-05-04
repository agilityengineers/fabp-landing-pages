import crypto from "crypto";
import { Resend } from "resend";

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
    console.error("[BD] BD_API_KEY not configured — skipping member creation");
    await sendFailureAlert(
      { name: data.name, lastName: data.lastName, email: data.email },
      "BD_API_KEY not configured on the server"
    );
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
      await sendFailureAlert(
        { name: data.name, lastName: data.lastName, email: data.email },
        errorDetail
      );
    } else {
      console.log("[BD] Member created successfully", text);
    }
  } catch (err) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    console.error("[BD] Member creation error:", err);
    await sendFailureAlert(
      { name: data.name, lastName: data.lastName, email: data.email },
      `Network/unexpected error: ${errorDetail}`
    );
  }
}
