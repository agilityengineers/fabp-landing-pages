"use client";

import { useEffect, useState, useCallback } from "react";
import { MAX_AUTO_RETRIES } from "@/lib/retry-config";

interface FailedSubmission {
  id: number;
  name: string;
  last_name: string | null;
  company: string | null;
  state: string | null;
  email: string;
  industry_slug: string | null;
  submitted_at: string | null;
  error_detail: string | null;
  created_at: string;
  resolved_at: string | null;
  status: string;
  retry_count: number;
}

type FilterStatus = "pending" | "resolved" | "dismissed" | "all";

function RetryBadge({ retryCount }: { retryCount: number }) {
  const eligible = retryCount < MAX_AUTO_RETRIES;
  return (
    <span className={`retry-badge ${eligible ? "eligible" : "exhausted"}`}>
      {eligible ? "Auto-retry eligible" : "Manual action needed"}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function FailedSubmissionsTable() {
  const [rows, setRows] = useState<FailedSubmission[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [errorMap, setErrorMap] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const url =
        filter === "all"
          ? "/api/admin/failed-submissions"
          : `/api/admin/failed-submissions?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      setRows(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: number, action: "retry" | "dismiss") {
    setActionId(id);
    setErrorMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
    try {
      const res = await fetch("/api/admin/failed-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMap((prev) => ({ ...prev, [id]: body.error ?? res.statusText }));
        return;
      }
      await load();
    } catch (e) {
      setErrorMap((prev) => ({ ...prev, [id]: e instanceof Error ? e.message : "Unknown error" }));
    } finally {
      setActionId(null);
    }
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const eligibleCount = rows.filter(
    (r) => r.status === "pending" && r.retry_count < MAX_AUTO_RETRIES
  ).length;
  const exhaustedCount = pendingCount - eligibleCount;

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <h1 className="admin-h1">Failed Submissions</h1>
          <p className="admin-sub">
            {loading
              ? "Loading…"
              : filter === "pending"
              ? `${pendingCount} pending · ${eligibleCount} auto-retry eligible · ${exhaustedCount} need manual action`
              : `${rows.length} ${filter === "all" ? "total" : filter}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["pending", "resolved", "dismissed", "all"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`ind-action${filter === s ? " primary" : ""}`}
              style={{ textTransform: "capitalize" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="fs-row fs-row-head">
          <span>Applicant</span>
          <span>Industry</span>
          <span>Submitted</span>
          <span>Retries</span>
          <span>Auto-retry status</span>
          <span>Error</span>
          <span />
        </div>

        {loading && (
          <div style={{ padding: "32px 18px", color: "var(--ink-500)", fontSize: 14 }}>
            Loading…
          </div>
        )}

        {!loading && fetchError && (
          <div style={{ padding: "32px 18px", color: "oklch(40% 0.18 25)", fontSize: 14 }}>
            Error: {fetchError}
          </div>
        )}

        {!loading && !fetchError && rows.length === 0 && (
          <div style={{ padding: "32px 18px", color: "var(--ink-500)", fontSize: 14 }}>
            No {filter === "all" ? "" : filter + " "}submissions found.
          </div>
        )}

        {!loading &&
          !fetchError &&
          rows.map((row) => (
            <SubmissionRow
              key={row.id}
              row={row}
              loading={actionId === row.id}
              error={errorMap[row.id]}
              onRetry={() => handleAction(row.id, "retry")}
              onDismiss={() => handleAction(row.id, "dismiss")}
            />
          ))}
      </div>
    </div>
  );
}

function SubmissionRow({
  row,
  loading,
  error,
  onRetry,
  onDismiss,
}: {
  row: FailedSubmission;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const fullName = [row.name, row.last_name].filter(Boolean).join(" ");

  return (
    <div className="fs-row">
      <div>
        <div className="ind-name">{fullName}</div>
        <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>
          {row.company}
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-700)" }}>
        {row.industry_slug ?? "—"}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
        {formatDate(row.submitted_at ?? row.created_at)}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-700)", fontVariantNumeric: "tabular-nums" }}>
        {row.retry_count} / {MAX_AUTO_RETRIES}
      </div>
      <div>
        {row.status === "pending" ? (
          <RetryBadge retryCount={row.retry_count} />
        ) : (
          <span className={`ind-status ${row.status === "resolved" ? "published" : "draft"}`}>
            {row.status}
          </span>
        )}
      </div>
      <div className="fs-error" title={row.error_detail ?? undefined}>
        {row.error_detail ?? <span style={{ color: "var(--ink-300)" }}>—</span>}
      </div>
      <div className="ind-actions">
        {row.status === "pending" && (
          <>
            <button
              className="ind-action primary"
              disabled={loading}
              onClick={onRetry}
            >
              {loading ? "…" : "Retry"}
            </button>
            <button
              className="ind-action danger"
              disabled={loading}
              onClick={onDismiss}
            >
              Dismiss
            </button>
            {error && (
              <span style={{ color: "oklch(50% 0.18 25)", fontSize: 11, alignSelf: "center" }}>
                {error}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
