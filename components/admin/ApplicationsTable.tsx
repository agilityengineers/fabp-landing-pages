"use client";
import { useMemo, useState } from "react";
import type { StoredApplication } from "@/lib/forms";

interface ApplicationsTableProps {
  applications: StoredApplication[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [selected, setSelected] = useState<StoredApplication | null>(null);

  const industries = useMemo(() => {
    const set = new Set(applications.map((a) => a.industrySlug));
    return Array.from(set).sort();
  }, [applications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (industry && a.industrySlug !== industry) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.profession.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
      );
    });
  }, [applications, query, industry]);

  function exportCsv() {
    if (filtered.length === 0) return;
    const headers = [
      "receivedAt",
      "industrySlug",
      "name",
      "email",
      "phone",
      "profession",
      "city",
      "years",
      "website",
      "spend",
      "fit",
    ];
    const rows = filtered.map((a) =>
      headers.map((h) => csvEscape((a as Record<string, unknown>)[h] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <h1 className="admin-h1">Applications</h1>
          <p className="admin-sub">
            {applications.length} total · {filtered.length} shown
          </p>
        </div>
        <button
          type="button"
          className="ind-action primary"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          style={{ padding: "10px 16px", fontSize: 13 }}
        >
          ⬇ Export CSV
        </button>
      </div>

      <div className="admin-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, profession, city…"
            style={{
              flex: "1 1 280px",
              padding: "10px 12px",
              border: "0.5px solid var(--rule)",
              borderRadius: "var(--r-md)",
              font: "14px var(--sans)",
            }}
          />
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "0.5px solid var(--rule)",
              borderRadius: "var(--r-md)",
              font: "14px var(--sans)",
              background: "#fff",
            }}
          >
            <option value="">All industries</option>
            {industries.map((slug) => (
              <option key={slug} value={slug}>
                /{slug}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "32px 4px", color: "var(--ink-500)", fontSize: 14 }}>
            {applications.length === 0
              ? "No applications received yet. They'll appear here as the public Apply form is submitted."
              : "No applications match those filters."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  border: "0.5px solid var(--rule)",
                  borderRadius: "var(--r-md)",
                  background: "#fff",
                  cursor: "pointer",
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.6fr 1fr 0.9fr",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{a.profession}</div>
                </div>
                <div style={{ fontSize: 13 }}>
                  <div>{a.email}</div>
                  {a.phone && (
                    <div style={{ color: "var(--ink-500)", fontSize: 12 }}>{a.phone}</div>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{a.city}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)", textAlign: "right" }}>
                  <div>/{a.industrySlug}</div>
                  <div>{formatDate(a.receivedAt)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && <Detail application={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Detail({
  application,
  onClose,
}: {
  application: StoredApplication;
  onClose: () => void;
}) {
  const fields: Array<[string, string | undefined]> = [
    ["Received", formatDate(application.receivedAt)],
    ["Submitted", formatDate(application.submittedAt)],
    ["Industry", `/${application.industrySlug}`],
    ["Name", application.name],
    ["Email", application.email],
    ["Phone", application.phone],
    ["Profession", application.profession],
    ["City", application.city],
    ["Years", application.years],
    ["Website", application.website],
    ["Marketing spend", application.spend],
    ["Why FABP fit", application.fit],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,42,71,0.32)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "60px 20px",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--r-lg, 12px)",
          maxWidth: 640,
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          padding: 24,
          boxShadow: "0 12px 48px rgba(11,42,71,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ font: "500 18px var(--serif)", margin: 0 }}>{application.name}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "var(--ink-500)",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {fields.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 12,
                fontSize: 13,
                paddingBottom: 8,
                borderBottom: "0.5px dashed var(--rule)",
              }}
            >
              <div style={{ color: "var(--ink-500)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.12em" }}>
                {label}
              </div>
              <div style={{ wordBreak: "break-word" }}>{value || <span style={{ color: "var(--ink-400)" }}>—</span>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
