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
  const rawApiUrl = process.env.BD_API_URL;
  const apiUrl = rawApiUrl?.replace(/\/+$/, "");

  if (!apiKey || !apiUrl) {
    console.error("[BD] BD_API_KEY or BD_API_URL not configured — skipping member creation");
    return;
  }

  const tempPassword = generateTempPassword();

  const payload = {
    api_key: apiKey,
    member_type: "Service Provider",
    plan_name: "Industry Featured Plan - Invitation",
    first_name: data.name,
    last_name: data.lastName,
    company: data.company,
    profession: data.profession,
    city: data.city,
    state: data.state,
    phone: data.phone ?? "",
    website: data.website ?? "",
    email: data.email,
    password: tempPassword,
  };

  try {
    const res = await fetch(`${apiUrl}/api/members/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[BD] Member creation failed: ${res.status} ${text}`);
    } else {
      console.log("[BD] Member created successfully");
    }
  } catch (err) {
    console.error("[BD] Member creation error:", err);
  }
}
