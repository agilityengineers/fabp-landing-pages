import fs from "fs";
import path from "path";
import crypto from "crypto";

export type ApplicationData = {
  name: string;
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

export type StoredApplication = ApplicationData & {
  id: string;
  receivedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.jsonl");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Submissions are always appended to data/applications.jsonl so the admin viewer
// can read them. When SLACK_WEBHOOK_URL is set, forwardToExternal also posts a
// Block Kit notification — failures are logged but do not fail the request, so
// leads are never dropped over a third-party outage.
export async function submitApplication(data: ApplicationData): Promise<void> {
  const stored: StoredApplication = {
    ...data,
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
  };

  ensureDataDir();
  fs.appendFileSync(APPLICATIONS_FILE, JSON.stringify(stored) + "\n", "utf-8");

  await forwardToExternal(stored);
}

async function forwardToExternal(application: StoredApplication): Promise<void> {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl) return;

  try {
    await postToSlack(slackUrl, application);
  } catch (err) {
    console.error("[applications] Slack delivery failed:", err);
  }
}

async function postToSlack(url: string, application: StoredApplication): Promise<void> {
  const fields: { label: string; value: string | undefined }[] = [
    { label: "Name", value: application.name },
    { label: "Email", value: application.email },
    { label: "Phone", value: application.phone },
    { label: "Profession", value: application.profession },
    { label: "City", value: application.city },
    { label: "Years in business", value: application.years },
    { label: "Website", value: application.website },
    { label: "Marketing spend", value: application.spend },
    { label: "Why a fit", value: application.fit },
  ];

  const fieldBlocks = fields
    .filter((f) => f.value && f.value.trim().length > 0)
    .map((f) => ({
      type: "mrkdwn",
      text: `*${f.label}:*\n${f.value}`,
    }));

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `New FABP application — ${application.industrySlug}` },
    },
    ...chunk(fieldBlocks, 10).map((group) => ({ type: "section", fields: group })),
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Submitted ${application.receivedAt} • id \`${application.id}\``,
        },
      ],
    },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `New FABP application from ${application.name} (${application.profession}, ${application.city})`,
      blocks,
    }),
  });
  if (!res.ok) {
    throw new Error(`Slack responded ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function listApplications(): StoredApplication[] {
  if (!fs.existsSync(APPLICATIONS_FILE)) return [];
  const raw = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        return JSON.parse(line) as StoredApplication;
      } catch {
        return null;
      }
    })
    .filter((row): row is StoredApplication => row !== null)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}
