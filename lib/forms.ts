import crypto from "crypto";

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

function generateTempPassword(): string {
  return crypto.randomBytes(16).toString("base64url");
}

async function sendFailureAlert(
  applicant: { name: string; lastName: string; email: string },
  errorDetail: string
): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[BD] ALERT_WEBHOOK_URL not set — skipping failure alert");
    return;
  }

  const fullName = `${applicant.name} ${applicant.lastName}`;
  const timestamp = new Date().toISOString();

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
      console.log("[BD] Failure alert sent successfully");
    }
  } catch (alertErr) {
    console.error("[BD] Failed to send failure alert:", alertErr);
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
  const subscriptionId = process.env.BD_SUBSCRIPTION_ID;

  if (!apiKey) {
    console.error("[BD] BD_API_KEY not configured — skipping member creation");
    await sendFailureAlert(
      { name: data.name, lastName: data.lastName, email: data.email },
      "BD_API_KEY not configured on the server"
    );
    return;
  }

  if (!subscriptionId) {
    console.error("[BD] BD_SUBSCRIPTION_ID not configured — skipping member creation");
    return;
  }

  const tempPassword = generateTempPassword();

  const fields: Record<string, string> = {
    email: data.email,
    password: tempPassword,
    subscription_id: subscriptionId,
    send_email_notifications: "1",
    first_name: data.name,
    last_name: data.lastName,
    company: data.company,
    listing_type: "Business",
    city: data.city,
    state_ln: data.state,
    position: data.profession,
  };

  if (data.phone) fields.phone = data.phone;
  if (data.website) fields.website = data.website;

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
