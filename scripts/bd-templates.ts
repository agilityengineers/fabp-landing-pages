import { argv, exit, env } from "process";

const BD_BASE = "https://www.findabusinesspro.com/api/v2/email_templates";

type TemplateRow = {
  email_id: string;
  email_name: string;
  email_type?: string;
  email_subject?: string;
  email_body?: string;
  triggers?: string;
  website?: string;
  category_id?: string;
  revision_timestamp?: string;
};

type ListResponse = {
  status: string;
  message: TemplateRow[];
  total?: string;
  current_page?: number;
  total_pages?: number;
  next_page?: string | number;
};

type GetResponse = {
  status: string;
  message: TemplateRow[] | TemplateRow;
};

function requireApiKey(): string {
  const key = env.BD_API_KEY;
  if (!key) {
    console.error("Error: BD_API_KEY is not set in the environment.");
    exit(1);
  }
  return key;
}

async function listTemplates(filter?: string): Promise<void> {
  const apiKey = requireApiKey();
  const all: TemplateRow[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const url = `${BD_BASE}/get?limit=${limit}&page=${page}`;
    const res = await fetch(url, { headers: { "X-Api-Key": apiKey, accept: "application/json" } });
    const text = await res.text();
    if (!res.ok) {
      console.error(`HTTP ${res.status} from ${url}`);
      console.error(text);
      exit(1);
    }
    let json: ListResponse;
    try {
      json = JSON.parse(text) as ListResponse;
    } catch {
      console.error("Could not parse response as JSON. Raw response:");
      console.error(text);
      exit(1);
    }
    if (json.status !== "success" || !Array.isArray(json.message)) {
      console.error("Unexpected response shape:");
      console.error(JSON.stringify(json, null, 2));
      exit(1);
    }
    all.push(...json.message);
    const totalPages = Number(json.total_pages ?? 1);
    if (page >= totalPages) break;
    page += 1;
    if (page > 50) break;
  }

  const needle = filter?.toLowerCase().trim();
  const rows = needle
    ? all.filter(
        (r) =>
          (r.email_name ?? "").toLowerCase().includes(needle) ||
          (r.email_subject ?? "").toLowerCase().includes(needle) ||
          (r.triggers ?? "").toLowerCase().includes(needle)
      )
    : all;

  console.log(`Fetched ${all.length} templates total${needle ? `, ${rows.length} match "${needle}"` : ""}.`);
  console.log("");
  console.log("ID    | Name                                     | Triggers                                  | Subject");
  console.log("------+------------------------------------------+-------------------------------------------+--------------------------------------------------");
  for (const r of rows) {
    const id = (r.email_id ?? "").padEnd(5);
    const name = (r.email_name ?? "").padEnd(40).slice(0, 40);
    const triggers = (r.triggers ?? "").padEnd(41).slice(0, 41);
    const subject = (r.email_subject ?? "").slice(0, 60);
    console.log(`${id} | ${name} | ${triggers} | ${subject}`);
  }

  console.log("");
  console.log("Tip: rows with a non-empty `triggers` column are sent automatically by BD.");
  console.log("Look for triggers containing 'user', 'member', 'welcome', 'account', or 'activated'.");
  console.log("Then run: npm run bd:get-template -- <id>");
}

async function getTemplate(id: string): Promise<void> {
  const apiKey = requireApiKey();
  const url = `${BD_BASE}/get/${encodeURIComponent(id)}`;
  const res = await fetch(url, { headers: { "X-Api-Key": apiKey, accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status} from ${url}`);
    console.error(text);
    exit(1);
  }
  let json: GetResponse;
  try {
    json = JSON.parse(text) as GetResponse;
  } catch {
    console.error("Could not parse response as JSON. Raw response:");
    console.error(text);
    exit(1);
  }
  if (json.status !== "success") {
    console.error("BD API returned a non-success status:");
    console.error(JSON.stringify(json, null, 2));
    exit(1);
  }
  const row: TemplateRow | undefined =
    Array.isArray(json.message)
      ? json.message[0]
      : (json.message && typeof json.message === "object" ? (json.message as TemplateRow) : undefined);
  if (!row || typeof row !== "object" || !row.email_id) {
    console.error("No template found with that id, or unexpected response shape. Full response:");
    console.error(JSON.stringify(json, null, 2));
    exit(1);
  }

  console.log("=== Template Metadata ===");
  console.log(`email_id:           ${row.email_id}`);
  console.log(`email_name:         ${row.email_name}`);
  console.log(`email_subject:      ${row.email_subject}`);
  console.log(`triggers:           ${row.triggers ?? "(none)"}`);
  console.log(`website:            ${row.website ?? "(none)"}`);
  console.log(`category_id:        ${row.category_id ?? "(none)"}`);
  console.log(`revision_timestamp: ${row.revision_timestamp ?? "(none)"}`);
  console.log("");
  console.log("=== email_body (raw) ===");
  console.log(row.email_body ?? "(empty)");
  console.log("");
  console.log("=== Merge tags found in body ===");
  const body = row.email_body ?? "";
  const tags = new Set<string>();
  const reBracket = /\[\*([a-z0-9_]+)\*\]/gi;
  const rePercent = /%%%([a-z0-9_]+)%%%/gi;
  let m: RegExpExecArray | null;
  while ((m = reBracket.exec(body)) !== null) tags.add(`[*${m[1]}*]`);
  while ((m = rePercent.exec(body)) !== null) tags.add(`%%%${m[1]}%%%`);
  if (tags.size === 0) {
    console.log("(none detected)");
  } else {
    for (const t of [...tags].sort()) console.log(`  ${t}`);
  }
}

async function fixResetPasswordTag(id: string, apply: boolean): Promise<void> {
  const apiKey = requireApiKey();

  // 1. Fetch current body
  const getUrl = `${BD_BASE}/get/${encodeURIComponent(id)}`;
  const getRes = await fetch(getUrl, { headers: { "X-Api-Key": apiKey, accept: "application/json" } });
  const getText = await getRes.text();
  if (!getRes.ok) {
    console.error(`HTTP ${getRes.status} from ${getUrl}`);
    console.error(getText);
    exit(1);
  }
  let json: GetResponse;
  try {
    json = JSON.parse(getText) as GetResponse;
  } catch {
    console.error("Could not parse GET response as JSON. Raw response:");
    console.error(getText);
    exit(1);
  }
  if (json.status !== "success") {
    console.error("BD API returned a non-success status on GET:");
    console.error(JSON.stringify(json, null, 2));
    exit(1);
  }
  const row: TemplateRow | undefined =
    Array.isArray(json.message)
      ? json.message[0]
      : (json.message && typeof json.message === "object" ? (json.message as TemplateRow) : undefined);
  if (!row || !row.email_id || typeof row.email_body !== "string") {
    console.error("No template/body found for that id. Full response:");
    console.error(JSON.stringify(json, null, 2));
    exit(1);
  }

  const original = row.email_body;
  // Replace the broken double-percent tag with the correct triple-percent tag.
  // Use a regex anchored on the literal token so we don't touch correct ones.
  const re = /%%set_password_url%%(?!%)/g;
  const matches = original.match(re);
  if (!matches || matches.length === 0) {
    console.log(`Template ${row.email_id} ("${row.email_name}") does not contain "%%set_password_url%%".`);
    if (original.includes("%%%set_password_url%%%")) {
      console.log("It already uses the correct \"%%%set_password_url%%%\" tag — nothing to fix.");
    } else {
      console.log("No reset-password merge tag was found at all. Manual edit required.");
    }
    return;
  }
  const updated = original.replace(re, "%%%set_password_url%%%");

  console.log(`Template ${row.email_id} ("${row.email_name}")`);
  console.log(`Found ${matches.length} occurrence(s) of "%%set_password_url%%" — will replace with "%%%set_password_url%%%".`);
  console.log("");
  console.log("=== BEFORE (snippet around first match) ===");
  const idx = original.indexOf("%%set_password_url%%");
  console.log(original.slice(Math.max(0, idx - 80), idx + 100));
  console.log("");
  console.log("=== AFTER (snippet around first match) ===");
  const idx2 = updated.indexOf("%%%set_password_url%%%");
  console.log(updated.slice(Math.max(0, idx2 - 80), idx2 + 100));
  console.log("");

  if (!apply) {
    console.log("Dry run — no changes sent. Re-run with `--apply` to PUT the update to BD.");
    return;
  }

  // 2. PUT the updated body back
  const putUrl = `${BD_BASE}/update`;
  const form = new URLSearchParams({
    email_id: String(row.email_id),
    email_body: updated,
  });
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: form.toString(),
  });
  const putText = await putRes.text();
  if (!putRes.ok) {
    console.error(`HTTP ${putRes.status} from PUT ${putUrl}`);
    console.error(putText);
    exit(1);
  }
  console.log("=== PUT response ===");
  console.log(putText);
  console.log("");
  console.log("Done. Submit a test application and confirm the welcome email now shows the reset link.");
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = argv;
  if (cmd === "list") {
    await listTemplates(rest[0]);
    return;
  }
  if (cmd === "get") {
    const id = rest[0];
    if (!id) {
      console.error("Usage: tsx scripts/bd-templates.ts get <email_id>");
      exit(1);
    }
    await getTemplate(id);
    return;
  }
  if (cmd === "fix-reset-tag") {
    const id = rest[0];
    if (!id) {
      console.error("Usage: tsx scripts/bd-templates.ts fix-reset-tag <email_id> [--apply]");
      exit(1);
    }
    const apply = rest.includes("--apply");
    await fixResetPasswordTag(id, apply);
    return;
  }
  console.error("Usage:");
  console.error("  tsx scripts/bd-templates.ts list [search]");
  console.error("  tsx scripts/bd-templates.ts get  <email_id>");
  console.error("  tsx scripts/bd-templates.ts fix-reset-tag <email_id> [--apply]");
  exit(1);
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
