import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  listInvitationLeads,
  listPlaybookLeads,
  type BviSyncStatus,
  type LeadType,
} from "@/lib/leads";

const ALLOWED_TYPES = new Set<LeadType>(["playbook", "invitation"]);
const ALLOWED_BVI: BviSyncStatus[] = [
  "pending",
  "synced",
  "failed",
  "skipped",
  "in_flight",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type") as LeadType | null;
  if (!typeParam || !ALLOWED_TYPES.has(typeParam)) {
    return NextResponse.json(
      { error: "type must be 'playbook' or 'invitation'" },
      { status: 400 },
    );
  }

  const industry = url.searchParams.get("industry") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const bviSyncRaw = url.searchParams.get("bvi") ?? undefined;
  const bviSyncStatus =
    bviSyncRaw && ALLOWED_BVI.includes(bviSyncRaw as BviSyncStatus)
      ? (bviSyncRaw as BviSyncStatus)
      : undefined;
  const format = url.searchParams.get("format");

  try {
    const rows =
      typeParam === "playbook"
        ? await listPlaybookLeads({ industry, status, search, bviSyncStatus })
        : await listInvitationLeads({ industry, status, search, bviSyncStatus });

    if (format === "csv") {
      const csv = rowsToCsv(rows as unknown as Record<string, unknown>[]);
      const today = new Date().toISOString().slice(0, 10);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${typeParam}-leads-${today}.csv"`,
        },
      });
    }

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[admin/leads] list failed:", err);
    return NextResponse.json(
      { error: "Failed to load leads" },
      { status: 500 },
    );
  }
}
