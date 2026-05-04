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
const BD_SUBSCRIPTION_ID = "21";

function generateTempPassword(): string {
  return crypto.randomBytes(16).toString("base64url");
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
    return;
  }

  const tempPassword = generateTempPassword();

  const fields: Record<string, string> = {
    email: data.email,
    password: tempPassword,
    subscription_id: BD_SUBSCRIPTION_ID,
    send_email_notifications: "1",
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

  try {
    const res = await fetch(BD_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Api-Key": apiKey,
      },
      body,
    });

    const text = await res.text();

    if (!res.ok) {
      console.error(`[BD] Member creation failed: ${res.status}`, text);
    } else {
      console.log("[BD] Member created successfully", text);
    }
  } catch (err) {
    console.error("[BD] Member creation error:", err);
  }
}
