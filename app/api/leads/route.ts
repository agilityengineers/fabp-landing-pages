import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

async function requireAuth(): Promise<boolean> {
  return isAuthenticated();
}

export interface PlaybookLeadRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  consent: boolean;
  industry_slug: string;
  user_agent: string | null;
  ip_address: string | null;
  submitted_at: string;
  slack_status: string;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function rowsToCsv(rows: PlaybookLeadRow[]): string {
  const header = [
    "id",
    "submitted_at",
    "first_name",
    "last_name",
    "email",
    "phone",
    "industry_slug",
    "consent",
    "slack_status",
    "ip_address",
    "user_agent",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.submitted_at,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.industry_slug,
        r.consent,
        r.slack_status,
        r.ip_address,
        r.user_agent,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const industry = url.searchParams.get("industry");
  const format = url.searchParams.get("format");

  const sql = industry
    ? `SELECT id, first_name, last_name, email, phone, consent, industry_slug,
              user_agent, ip_address, submitted_at, slack_status
         FROM playbook_leads
         WHERE industry_slug = $1
         ORDER BY submitted_at DESC`
    : `SELECT id, first_name, last_name, email, phone, consent, industry_slug,
              user_agent, ip_address, submitted_at, slack_status
         FROM playbook_leads
         ORDER BY submitted_at DESC`;

  let rows: PlaybookLeadRow[];
  try {
    const result = industry ? await query(sql, [industry]) : await query(sql);
    rows = result.rows as PlaybookLeadRow[];
  } catch (err) {
    console.error("[leads] DB query failed:", err);
    return NextResponse.json(
      { error: "Failed to load leads" },
      { status: 500 },
    );
  }

  if (format === "csv") {
    const csv = rowsToCsv(rows);
    const filename = `playbook-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json(rows);
}
