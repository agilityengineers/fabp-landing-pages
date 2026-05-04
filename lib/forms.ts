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

// TODO(decision): Wire to Brilliant Directories API (or Resend / HubSpot) before launch.
// Until then, every submission is appended to data/applications.jsonl so the admin
// viewer can read them. Swap the body of forwardToExternal() to send elsewhere.
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

async function forwardToExternal(_application: StoredApplication): Promise<void> {
  // TODO(decision): Replace with Brilliant Directories submission, e.g.:
  // await fetch(`${process.env.BD_API_URL}/applications`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${process.env.BD_API_KEY}`,
  //   },
  //   body: JSON.stringify(_application),
  // });
  // Throwing here will surface to the route handler and return 500 to the form.
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
