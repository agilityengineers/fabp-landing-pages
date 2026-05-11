"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LeadType = "playbook" | "invitation";

interface BaseLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  industry_slug: string;
  submitted_at: string;
  status: string;
  assigned_to: string | null;
  bvi_sync_status: "pending" | "synced" | "failed" | "skipped" | "in_flight";
  bvi_synced_at: string | null;
  bvi_last_error: string | null;
  bvi_external_id: string | null;
}

interface PlaybookRow extends BaseLead {
  consent: boolean;
  slack_status: string;
}

interface InvitationRow extends BaseLead {
  company: string | null;
  profession: string | null;
  city: string | null;
  state: string | null;
  years: string | null;
  website: string | null;
  spend: string | null;
  fit: string | null;
  invitation_step: "apply" | "brand_voice_interview" | "listed";
  interview_scheduled_at: string | null;
  listing_published_at: string | null;
  bd_status: "pending" | "created" | "failed";
  bd_error: string | null;
  bd_user_id: string | null;
}

type Lead = PlaybookRow | InvitationRow;

interface Note {
  id: number;
  lead_type: LeadType;
  lead_id: number;
  author: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface ActivityEvent {
  id: number;
  event_type: string;
  actor: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface BviAttempt {
  id: number;
  attempt: number;
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  created_at: string;
}

const PLAYBOOK_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
  "archived",
];
const INVITATION_STATUSES = [
  "new",
  "screening",
  "interview_scheduled",
  "listed",
  "disqualified",
  "won",
  "lost",
  "archived",
];
const INVITATION_STEPS = ["apply", "brand_voice_interview", "listed"];

const STEP_LABEL: Record<string, string> = {
  apply: "01 · Apply",
  brand_voice_interview: "02 · Brand Voice Interview",
  listed: "03 · Listed",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
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

function StatusPill({ value, tone = "neutral" }: { value: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "oklch(94% 0.02 250)", fg: "var(--ink-700)" },
    good: { bg: "oklch(95% 0.06 140)", fg: "var(--green-700)" },
    warn: { bg: "oklch(95% 0.08 75)", fg: "oklch(40% 0.14 75)" },
    bad: { bg: "oklch(95% 0.08 25)", fg: "oklch(40% 0.18 25)" },
  };
  const { bg, fg } = palette[tone];
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
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  );
}

function bviTone(status: BaseLead["bvi_sync_status"]) {
  switch (status) {
    case "synced":
      return "good" as const;
    case "failed":
      return "bad" as const;
    case "in_flight":
      return "warn" as const;
    default:
      return "neutral" as const;
  }
}

function nextActionFor(lead: InvitationRow): string {
  if (lead.bd_status === "failed")
    return "Brilliant Directories member create failed — review failed_submissions";
  if (lead.invitation_step === "apply" && lead.status === "new")
    return "Run 5-minute screening; mark contacted/qualified";
  if (
    lead.invitation_step === "apply" &&
    (lead.status === "qualified" || lead.status === "screening")
  )
    return "Schedule the Brand Voice Interview";
  if (lead.invitation_step === "brand_voice_interview")
    return "Conduct interview; once published, mark step → listed";
  if (lead.invitation_step === "listed") return "Listing live — monitor inquiries";
  if (lead.bvi_sync_status === "failed")
    return "BVI push failed — retry from this drawer";
  return "Awaiting next action";
}

interface ManagerProps {
  leadType: LeadType;
}

export function LeadsManager({ leadType }: ManagerProps) {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bviFilter, setBviFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const statuses = leadType === "playbook" ? PLAYBOOK_STATUSES : INVITATION_STATUSES;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: leadType });
      if (industryFilter !== "all") params.set("industry", industryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (bviFilter !== "all") params.set("bvi", bviFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/leads?${params}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setRows((await res.json()) as Lead[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [leadType, industryFilter, statusFilter, bviFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.industry_slug);
    return Array.from(set).sort();
  }, [rows]);

  function exportCsv() {
    const params = new URLSearchParams({ type: leadType, format: "csv" });
    if (industryFilter !== "all") params.set("industry", industryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    window.location.href = `/api/admin/leads?${params}`;
  }

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <h1 className="admin-h1">
            {leadType === "playbook" ? "Playbook leads" : "Invitation leads"}
          </h1>
          <p className="admin-sub">
            {loading ? "Loading…" : `${rows.length} lead${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ind-action"
            style={{ padding: "6px 10px", minWidth: 200 }}
          />
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ind-action"
            style={{ padding: "6px 10px" }}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={bviFilter}
            onChange={(e) => setBviFilter(e.target.value)}
            className="ind-action"
            style={{ padding: "6px 10px" }}
          >
            <option value="all">BVI: all</option>
            <option value="pending">BVI: pending</option>
            <option value="synced">BVI: synced</option>
            <option value="failed">BVI: failed</option>
            <option value="in_flight">BVI: in flight</option>
            <option value="skipped">BVI: skipped</option>
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
          style={{
            gridTemplateColumns:
              leadType === "invitation"
                ? "1.4fr 1.4fr 1fr 1.2fr 1fr 1fr 0.9fr"
                : "1.4fr 1.6fr 0.9fr 1fr 1fr 1fr",
          }}
        >
          <span>Name</span>
          <span>Email</span>
          {leadType === "invitation" && <span>Industry · Step</span>}
          {leadType === "playbook" && <span>Industry</span>}
          <span>Status</span>
          {leadType === "invitation" && <span>BD</span>}
          <span>BVI</span>
          <span>Submitted</span>
        </div>

        {loading && (
          <div style={{ padding: "32px 18px", color: "var(--ink-500)", fontSize: 14 }}>Loading…</div>
        )}
        {!loading && error && (
          <div style={{ padding: "32px 18px", color: "oklch(40% 0.18 25)", fontSize: 14 }}>
            Error: {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: "32px 18px", color: "var(--ink-500)", fontSize: 14 }}>
            No leads match these filters yet.
          </div>
        )}

        {!loading &&
          !error &&
          rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
              className="leads-row"
              style={{
                gridTemplateColumns:
                  leadType === "invitation"
                    ? "1.4fr 1.4fr 1fr 1.2fr 1fr 1fr 0.9fr"
                    : "1.4fr 1.6fr 0.9fr 1fr 1fr 1fr",
                cursor: "pointer",
                background: "transparent",
                border: 0,
                textAlign: "left",
                width: "100%",
                padding: 0,
              }}
            >
              <div className="ind-name" style={{ padding: "10px 14px" }}>
                {row.first_name} {row.last_name}
              </div>
              <div style={{ fontSize: 13, padding: "10px 14px" }}>
                <span style={{ color: "var(--ink-700)" }}>{row.email}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-700)", padding: "10px 14px" }}>
                {row.industry_slug}
                {leadType === "invitation" &&
                  ` · ${STEP_LABEL[(row as InvitationRow).invitation_step]}`}
              </div>
              <div style={{ padding: "10px 14px" }}>
                <StatusPill value={row.status} />
              </div>
              {leadType === "invitation" && (
                <div style={{ padding: "10px 14px" }}>
                  <StatusPill
                    value={(row as InvitationRow).bd_status}
                    tone={
                      (row as InvitationRow).bd_status === "created"
                        ? "good"
                        : (row as InvitationRow).bd_status === "failed"
                          ? "bad"
                          : "neutral"
                    }
                  />
                </div>
              )}
              <div style={{ padding: "10px 14px" }}>
                <StatusPill value={row.bvi_sync_status} tone={bviTone(row.bvi_sync_status)} />
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-500)", padding: "10px 14px" }}>
                {formatDate(row.submitted_at)}
              </div>
            </button>
          ))}
      </div>

      {selectedId !== null && (
        <LeadDrawer
          leadType={leadType}
          leadId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

interface DrawerProps {
  leadType: LeadType;
  leadId: number;
  onClose: () => void;
  onChanged: () => void;
}

interface DetailResponse {
  lead: Lead & { lead_type: LeadType };
  notes: Note[];
  events: ActivityEvent[];
  bviAttempts: BviAttempt[];
}

function LeadDrawer({ leadType, leadId, onClose, onChanged }: DrawerProps) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadType}/${leadId}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const body = (await res.json()) as DetailResponse;
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [leadType, leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchLead(patch: Record<string, unknown>) {
    setBusy("patch");
    try {
      const res = await fetch(`/api/admin/leads/${leadType}/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function addNote() {
    const body = noteDraft.trim();
    if (!body) return;
    setBusy("note");
    try {
      const res = await fetch(`/api/admin/leads/${leadType}/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setNoteDraft("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function saveEditedNote() {
    if (editingNoteId === null) return;
    const body = editingNoteBody.trim();
    if (!body) return;
    setBusy("note");
    try {
      const res = await fetch(
        `/api/admin/leads/${leadType}/${leadId}/notes/${editingNoteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setEditingNoteId(null);
      setEditingNoteBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function deleteNote(noteId: number) {
    if (!confirm("Delete this note?")) return;
    setBusy("note");
    try {
      const res = await fetch(
        `/api/admin/leads/${leadType}/${leadId}/notes/${noteId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function pushBvi() {
    setBusy("bvi");
    try {
      const res = await fetch(`/api/admin/leads/${leadType}/${leadId}/sync-bvi`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function deleteLead() {
    if (!confirm("Soft-delete this lead? This hides it from all views.")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/leads/${leadType}/${leadId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setBusy(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,42,71,0.42)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          height: "100%",
          background: "var(--paper)",
          boxShadow: "var(--sh-3)",
          padding: "28px 28px 64px",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="admin-h1" style={{ margin: 0, fontSize: 22 }}>
            Lead detail
          </h2>
          <button onClick={onClose} className="ind-action" type="button">
            Close
          </button>
        </div>

        {loading && <p style={{ marginTop: 24, color: "var(--ink-500)" }}>Loading…</p>}
        {error && (
          <p style={{ marginTop: 24, color: "oklch(40% 0.18 25)" }}>Error: {error}</p>
        )}

        {data && (
          <>
            <LeadHeader leadType={leadType} lead={data.lead} />

            <Section title="Pipeline">
              <PipelineControls
                leadType={leadType}
                lead={data.lead}
                busy={busy}
                onPatch={patchLead}
              />
            </Section>

            <Section title="BVI sync">
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <StatusPill
                  value={data.lead.bvi_sync_status}
                  tone={bviTone(data.lead.bvi_sync_status)}
                />
                {data.lead.bvi_synced_at && (
                  <span style={{ fontSize: 12, color: "var(--ink-500)" }}>
                    last synced {formatDate(data.lead.bvi_synced_at)}
                  </span>
                )}
                {data.lead.bvi_external_id && (
                  <span style={{ fontSize: 12, color: "var(--ink-500)" }}>
                    BVI id: {data.lead.bvi_external_id}
                  </span>
                )}
                <button
                  type="button"
                  className="ind-action primary"
                  onClick={pushBvi}
                  disabled={busy !== null}
                >
                  {busy === "bvi"
                    ? "Pushing…"
                    : data.lead.bvi_sync_status === "synced"
                      ? "Re-push to BVI"
                      : "Push to BVI now"}
                </button>
              </div>
              {data.lead.bvi_last_error && (
                <pre
                  style={{
                    marginTop: 10,
                    padding: 10,
                    background: "oklch(96% 0.02 25)",
                    color: "oklch(35% 0.18 25)",
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    borderRadius: 6,
                  }}
                >
                  {data.lead.bvi_last_error}
                </pre>
              )}
              {data.bviAttempts.length > 0 && (
                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: "pointer", fontSize: 13 }}>
                    {data.bviAttempts.length} sync attempt
                    {data.bviAttempts.length === 1 ? "" : "s"} (newest first)
                  </summary>
                  <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                    {data.bviAttempts.map((a) => (
                      <li key={a.id} style={{ fontSize: 12, marginBottom: 6 }}>
                        <code>#{a.attempt}</code> · {formatDate(a.created_at)} · status{" "}
                        {a.response_status ?? "—"} · {a.error ?? "ok"}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </Section>

            <Section title="Notes">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add an internal note (visible only to admins)…"
                  style={{
                    padding: 10,
                    border: "1px solid var(--rule)",
                    borderRadius: 6,
                    fontFamily: "inherit",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
                <button
                  type="button"
                  className="ind-action primary"
                  onClick={addNote}
                  disabled={!noteDraft.trim() || busy !== null}
                  style={{ alignSelf: "flex-end" }}
                >
                  {busy === "note" ? "Saving…" : "Add note"}
                </button>
              </div>

              {data.notes.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 12 }}>
                  No notes yet.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                  {data.notes.map((n) => (
                    <li
                      key={n.id}
                      style={{
                        padding: 12,
                        borderTop: "1px solid var(--rule)",
                        fontSize: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, color: "var(--ink-500)" }}>
                          {n.author} · {formatDate(n.created_at)}
                          {n.updated_at !== n.created_at &&
                            ` · edited ${formatDate(n.updated_at)}`}
                        </span>
                        <span style={{ display: "flex", gap: 6 }}>
                          {editingNoteId === n.id ? (
                            <>
                              <button
                                type="button"
                                className="ind-action primary"
                                onClick={saveEditedNote}
                                disabled={busy !== null}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="ind-action"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingNoteBody("");
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="ind-action"
                                onClick={() => {
                                  setEditingNoteId(n.id);
                                  setEditingNoteBody(n.body);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ind-action danger"
                                onClick={() => deleteNote(n.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </span>
                      </div>
                      {editingNoteId === n.id ? (
                        <textarea
                          rows={3}
                          value={editingNoteBody}
                          onChange={(e) => setEditingNoteBody(e.target.value)}
                          style={{
                            width: "100%",
                            padding: 8,
                            border: "1px solid var(--rule)",
                            borderRadius: 6,
                            fontFamily: "inherit",
                            fontSize: 14,
                          }}
                        />
                      ) : (
                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{n.body}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Activity">
              {data.events.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-500)" }}>No activity yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, fontSize: 13 }}>
                  {data.events.map((e) => (
                    <li
                      key={e.id}
                      style={{
                        padding: "8px 0",
                        borderTop: "1px solid var(--rule)",
                        color: "var(--ink-700)",
                      }}
                    >
                      <span style={{ color: "var(--ink-500)", marginRight: 8 }}>
                        {formatDate(e.created_at)}
                      </span>
                      <code>{e.event_type}</code>
                      {e.actor && <span> · {e.actor}</span>}
                      {e.payload && (
                        <details style={{ display: "inline-block", marginLeft: 8 }}>
                          <summary style={{ cursor: "pointer", fontSize: 11 }}>
                            payload
                          </summary>
                          <pre style={{ fontSize: 11, color: "var(--ink-500)" }}>
                            {JSON.stringify(e.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="ind-action danger"
                onClick={deleteLead}
                disabled={busy !== null}
              >
                {busy === "delete" ? "Deleting…" : "Delete lead"}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h3
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
          marginBottom: 12,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function LeadHeader({
  leadType,
  lead,
}: {
  leadType: LeadType;
  lead: Lead & { lead_type: LeadType };
}) {
  const fullName = `${lead.first_name} ${lead.last_name}`.trim();
  return (
    <div style={{ marginTop: 18 }}>
      <div className="serif" style={{ fontSize: 22, fontWeight: 500 }}>
        {fullName}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 4 }}>
        <a href={`mailto:${lead.email}`} style={{ color: "var(--ink-700)" }}>
          {lead.email}
        </a>
        {lead.phone && ` · ${lead.phone}`}
        {" · "}
        {lead.industry_slug}
        {" · "}
        submitted {formatDate(lead.submitted_at)}
      </div>
      {leadType === "invitation" && (
        <>
          <p
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "var(--paper-2)",
              borderRadius: 6,
              fontSize: 13,
              color: "var(--ink-700)",
            }}
          >
            <strong style={{ marginRight: 6 }}>Next action:</strong>
            {nextActionFor(lead as InvitationRow)}
          </p>
          <InvitationDetails lead={lead as InvitationRow} />
        </>
      )}
    </div>
  );
}

function InvitationDetails({ lead }: { lead: InvitationRow }) {
  const fields: { label: string; value: string | null }[] = [
    { label: "Company", value: lead.company },
    { label: "Profession", value: lead.profession },
    { label: "Market", value: [lead.city, lead.state].filter(Boolean).join(", ") || null },
    { label: "Years", value: lead.years },
    { label: "Website", value: lead.website },
    { label: "Spend", value: lead.spend },
    { label: "BD user id", value: lead.bd_user_id },
  ];
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "6px 18px",
        marginTop: 12,
        fontSize: 13,
      }}
    >
      {fields.map((f) => (
        <div key={f.label}>
          <dt style={{ color: "var(--ink-500)", fontSize: 11 }}>{f.label}</dt>
          <dd style={{ margin: 0, color: "var(--ink-700)" }}>{f.value ?? "—"}</dd>
        </div>
      ))}
      {lead.fit && (
        <div style={{ gridColumn: "1 / -1" }}>
          <dt style={{ color: "var(--ink-500)", fontSize: 11 }}>Why a fit</dt>
          <dd
            style={{
              margin: 0,
              color: "var(--ink-700)",
              whiteSpace: "pre-wrap",
            }}
          >
            {lead.fit}
          </dd>
        </div>
      )}
      {lead.bd_error && (
        <div style={{ gridColumn: "1 / -1" }}>
          <dt style={{ color: "oklch(40% 0.18 25)", fontSize: 11 }}>BD error</dt>
          <dd
            style={{
              margin: 0,
              color: "oklch(40% 0.18 25)",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--mono)",
              fontSize: 11,
            }}
          >
            {lead.bd_error}
          </dd>
        </div>
      )}
    </dl>
  );
}

function PipelineControls({
  leadType,
  lead,
  busy,
  onPatch,
}: {
  leadType: LeadType;
  lead: Lead & { lead_type: LeadType };
  busy: string | null;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const statuses = leadType === "playbook" ? PLAYBOOK_STATUSES : INVITATION_STATUSES;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
        <span style={{ color: "var(--ink-500)" }}>Status</span>
        <select
          value={lead.status}
          onChange={(e) => onPatch({ status: e.target.value })}
          disabled={busy !== null}
          className="ind-action"
          style={{ padding: "6px 10px", maxWidth: 280 }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {leadType === "invitation" && (
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <span style={{ color: "var(--ink-500)" }}>Step</span>
          <select
            value={(lead as InvitationRow).invitation_step}
            onChange={(e) => onPatch({ invitation_step: e.target.value })}
            disabled={busy !== null}
            className="ind-action"
            style={{ padding: "6px 10px", maxWidth: 280 }}
          >
            {INVITATION_STEPS.map((s) => (
              <option key={s} value={s}>
                {STEP_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        </label>
      )}

      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
        <span style={{ color: "var(--ink-500)" }}>Assigned to</span>
        <input
          defaultValue={lead.assigned_to ?? ""}
          disabled={busy !== null}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (lead.assigned_to ?? "")) {
              void onPatch({ assigned_to: v || null });
            }
          }}
          placeholder="email or name of sales rep"
          className="ind-action"
          style={{ padding: "6px 10px", maxWidth: 280 }}
        />
      </label>

      {leadType === "invitation" && (
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
          <span style={{ color: "var(--ink-500)" }}>Interview scheduled at</span>
          <input
            type="datetime-local"
            defaultValue={
              (lead as InvitationRow).interview_scheduled_at
                ? toLocalInput((lead as InvitationRow).interview_scheduled_at!)
                : ""
            }
            disabled={busy !== null}
            onBlur={(e) => {
              const v = e.target.value;
              const iso = v ? new Date(v).toISOString() : null;
              if (iso !== (lead as InvitationRow).interview_scheduled_at) {
                void onPatch({ interview_scheduled_at: iso });
              }
            }}
            className="ind-action"
            style={{ padding: "6px 10px", maxWidth: 280 }}
          />
        </label>
      )}
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
