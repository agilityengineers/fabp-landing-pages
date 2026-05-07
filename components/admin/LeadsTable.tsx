"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface PlaybookLead {
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function LeadsTable() {
  const [rows, setRows] = useState<PlaybookLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        industryFilter === "all"
          ? "/api/leads"
          : `/api/leads?industry=${encodeURIComponent(industryFilter)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setRows((await res.json()) as PlaybookLead[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [industryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.industry_slug);
    return Array.from(set).sort();
  }, [rows]);

  function exportCsv() {
    const url =
      industryFilter === "all"
        ? "/api/leads?format=csv"
        : `/api/leads?format=csv&industry=${encodeURIComponent(industryFilter)}`;
    window.location.href = url;
  }

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <h1 className="admin-h1">Playbook leads</h1>
          <p className="admin-sub">
            {loading
              ? "Loading…"
              : `${rows.length} lead${rows.length === 1 ? "" : "s"}${
                  industryFilter === "all" ? "" : ` · ${industryFilter}`
                }`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="ind-action"
            style={{ padding: "6px 10px" }}
          >
            <option value="all">All industries</option>
            {industries.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ind-action primary"
            onClick={exportCsv}
            disabled={rows.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div
          className="leads-row leads-row-head"
        >
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Industry</span>
          <span>Submitted</span>
          <span>Slack</span>
        </div>

        {loading && (
          <div style={{ padding: "32px 18px", color: "var(--ink-500)", fontSize: 14 }}>
            Loading…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: "32px 18px", color: "oklch(40% 0.18 25)", fontSize: 14 }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: "32px 18px", color: "var(--ink-500)", fontSize: 14 }}>
            No leads yet. Submissions will appear here as soon as the form is
            used.
          </div>
        )}

        {!loading && !error && rows.map((row) => (
          <div key={row.id} className="leads-row">
            <div className="ind-name">
              {row.first_name} {row.last_name}
            </div>
            <div style={{ fontSize: 13 }}>
              <a href={`mailto:${row.email}`} style={{ color: "var(--ink-700)" }}>
                {row.email}
              </a>
            </div>
            <div style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
              {row.phone}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-700)" }}>
              {row.industry_slug}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
              {formatDate(row.submitted_at)}
            </div>
            <div>
              <SlackBadge status={row.slack_status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlackBadge({ status }: { status: string }) {
  const palette: Record<string, { bg: string; fg: string; label: string }> = {
    sent: { bg: "oklch(95% 0.06 140)", fg: "var(--green-700)", label: "sent" },
    failed: { bg: "oklch(95% 0.08 25)", fg: "oklch(40% 0.18 25)", label: "failed" },
    skipped: { bg: "oklch(94% 0.02 250)", fg: "var(--ink-500)", label: "skipped" },
    pending: { bg: "oklch(94% 0.02 250)", fg: "var(--ink-500)", label: "pending" },
  };
  const { bg, fg, label } = palette[status] ?? palette.pending;
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: "3px 8px",
        borderRadius: 999,
        fontFamily: "var(--mono)",
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
