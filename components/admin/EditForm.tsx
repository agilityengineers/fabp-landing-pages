"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Industry } from "@/config/schema";
import { ToggleSwitch } from "./ToggleSwitch";
import { AccentPicker } from "./AccentPicker";

interface EditFormProps {
  industry: Industry;
  isGenerated?: boolean;
}

type Sections = Industry["sections"];

const PREVIEW_PREF_KEY = "fabp:preview-open";

export function EditForm({ industry: initial, isGenerated = false }: EditFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Industry>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStale, setPreviewStale] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewReadyRef = useRef(false);
  const previewTimer = useRef<NodeJS.Timeout | null>(null);
  const draftRef = useRef<Industry>(initial);
  draftRef.current = draft;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(PREVIEW_PREF_KEY) === "1") {
      setPreviewOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREVIEW_PREF_KEY, previewOpen ? "1" : "0");
  }, [previewOpen]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== "fabp:preview-ready") return;
      if (e.source !== previewIframeRef.current?.contentWindow) return;
      previewReadyRef.current = true;
      postDraftToPreview(draftRef.current);
      setPreviewStale(false);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function postDraftToPreview(data: Industry) {
    const win = previewIframeRef.current?.contentWindow;
    if (!win || !previewReadyRef.current) return;
    win.postMessage({ type: "fabp:preview", cfg: data }, "*");
  }

  function schedulePreview(data: Industry) {
    setPreviewStale(true);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      postDraftToPreview(data);
      setPreviewStale(false);
    }, 250);
  }

  function update<K extends keyof Industry>(k: K, v: Industry[K]) {
    const next = { ...draft, [k]: v };
    setDraft(next);
    scheduleSave(next);
    schedulePreview(next);
  }

  function updateNested<K extends keyof Industry>(k: K, subk: string, v: unknown) {
    const next = { ...draft, [k]: { ...(draft[k] as object), [subk]: v } } as Industry;
    setDraft(next);
    scheduleSave(next);
    schedulePreview(next);
  }

  function updateVillain(i: number, field: "t" | "b", v: string) {
    const villains = [...draft.problem.villains];
    villains[i] = { ...villains[i], [field]: v };
    update("problem", { ...draft.problem, villains });
  }

  function updateStat(i: number, field: "v" | "l", v: string) {
    const stats = [...draft.promise.stats];
    stats[i] = { ...stats[i], [field]: v };
    update("promise", { ...draft.promise, stats });
  }

  function updateFaq(i: number, field: "q" | "a", v: string) {
    const faq = [...draft.faq];
    faq[i] = { ...faq[i], [field]: v };
    update("faq", faq);
  }

  function moveFaq(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= draft.faq.length) return;
    const faq = [...draft.faq];
    [faq[i], faq[j]] = [faq[j], faq[i]];
    update("faq", faq);
  }

  function addFaq() {
    if (draft.faq.length >= 6) return;
    update("faq", [...draft.faq, { q: "", a: "" }]);
  }

  function removeFaq(i: number) {
    if (draft.faq.length <= 4) return;
    const faq = draft.faq.filter((_, idx) => idx !== i);
    update("faq", faq);
  }

  function updateSection(k: keyof Sections, v: boolean) {
    update("sections", { ...draft.sections, [k]: v });
  }

  const scheduleSave = useCallback(
    (data: Industry) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => autoSave(data), 800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function autoSave(data: Industry) {
    setSaving(true);
    try {
      const res = await fetch("/api/industries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const updated = { ...draft, published: true };
      const res = await fetch("/api/industries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Publish failed");
      setDraft(updated);
      setSavedAt(new Date());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateSection(section: string) {
    setRegenLoading(section);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: draft.slug, section }),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      const updated = await res.json();
      const next = { ...draftRef.current, [section]: updated[section] } as Industry;
      setDraft(next);
      setSavedAt(new Date());
      schedulePreview(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regen failed");
    } finally {
      setRegenLoading(null);
    }
  }

  const saveStatus = saving
    ? "Saving…"
    : savedAt
    ? `Auto-saved · ${formatRelative(savedAt)}`
    : "Unsaved changes";

  return (
    <div className={previewOpen ? "admin-main edit-with-preview" : "admin-main"}>
      <div className="admin-bar">
        <div>
          <a href="/admin" className="ind-action" style={{ marginBottom: 10, display: "inline-flex" }}>
            ← Industries
          </a>
          <h1 className="admin-h1">
            {isGenerated ? "Review draft" : `Edit: ${draft.industry}`}
          </h1>
          <p className="admin-sub">
            {isGenerated
              ? "Claude drafted the page below. Edit anything before publishing."
              : "Edit, regenerate any section, or publish/unpublish."}
          </p>
        </div>
        {isGenerated && (
          <div
            style={{
              padding: "6px 12px",
              background: "oklch(95% 0.06 140)",
              color: "var(--green-700)",
              borderRadius: 999,
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            ✨ AI-generated draft
          </div>
        )}
      </div>

      {error && (
        <div className="login-err" style={{ marginBottom: 16, marginLeft: 0 }}>
          ⚠️ {error}{" "}
          <button onClick={() => setError("")} style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
            Dismiss
          </button>
        </div>
      )}

      <div className="edit-split">
      <div className="edit-form-pane">
      <div className="admin-card">
        {/* Identifiers */}
        <div className="form-section">
          <div className="form-section-h">Identifiers</div>
          <div className="field-row">
            <div className="field">
              <label>Display name</label>
              <input
                value={draft.industry}
                onChange={(e) => update("industry", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Slug (read-only)</label>
              <input value={draft.slug} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="form-section">
          <div className="form-section-h">
            Hero
            <RegenButton section="hero" loading={regenLoading === "hero"} onRegen={regenerateSection} />
          </div>
          <div className="field">
            <label>Headline (use &lt;em&gt; for italic phrase)</label>
            <input
              value={draft.hero.headline}
              onChange={(e) => updateNested("hero", "headline", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Subhead</label>
            <textarea
              value={draft.hero.subhead}
              onChange={(e) => updateNested("hero", "subhead", e.target.value)}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Primary CTA</label>
              <input
                value={draft.hero.primaryCta}
                onChange={(e) => updateNested("hero", "primaryCta", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Secondary CTA</label>
              <input
                value={draft.hero.secondaryCta}
                onChange={(e) => updateNested("hero", "secondaryCta", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Hero image URL (Unsplash or other)</label>
            <input
              value={draft.hero.heroImage ?? ""}
              onChange={(e) => updateNested("hero", "heroImage", e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        {/* Problem / Villains */}
        <div className="form-section">
          <div className="form-section-h">
            Villains (4)
            <RegenButton section="problem" loading={regenLoading === "problem"} onRegen={regenerateSection} />
          </div>
          {draft.problem.villains.map((v, i) => (
            <div key={i} className="villain-edit">
              <div className="villain-edit-num">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <input value={v.t} onChange={(e) => updateVillain(i, "t", e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <textarea
                    value={v.b}
                    onChange={(e) => updateVillain(i, "b", e.target.value)}
                    style={{ minHeight: 50 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promise */}
        <div className="form-section">
          <div className="form-section-h">
            Promise
            <RegenButton section="promise" loading={regenLoading === "promise"} onRegen={regenerateSection} />
          </div>
          <div className="field">
            <label>Promise headline (90-day arc)</label>
            <textarea
              value={draft.promise.headline}
              onChange={(e) => updateNested("promise", "headline", e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {draft.promise.stats.map((s, i) => (
              <div key={i}>
                <div className="field" style={{ marginBottom: 6 }}>
                  <label>Stat {i + 1} value</label>
                  <input value={s.v} onChange={(e) => updateStat(i, "v", e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Stat {i + 1} label</label>
                  <input value={s.l} onChange={(e) => updateStat(i, "l", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample profile */}
        <div className="form-section">
          <div className="form-section-h">
            Sample profile
            <RegenButton section="profile" loading={regenLoading === "profile"} onRegen={regenerateSection} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Name</label>
              <input
                value={draft.profile.name}
                onChange={(e) => updateNested("profile", "name", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Role</label>
              <input
                value={draft.profile.role}
                onChange={(e) => updateNested("profile", "role", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>City</label>
            <input
              value={draft.profile.city}
              onChange={(e) => updateNested("profile", "city", e.target.value)}
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="form-section">
          <div className="form-section-h">
            FAQ ({draft.faq.length})
            <RegenButton section="faq" loading={regenLoading === "faq"} onRegen={regenerateSection} />
          </div>
          {draft.faq.map((f, i) => (
            <div key={i} className="villain-edit" style={{ alignItems: "start" }}>
              <div className="villain-edit-num">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <input
                    value={f.q}
                    onChange={(e) => updateFaq(i, "q", e.target.value)}
                    placeholder="Question"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <textarea
                    value={f.a}
                    onChange={(e) => updateFaq(i, "a", e.target.value)}
                    style={{ minHeight: 60 }}
                    placeholder="Answer"
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 8 }}>
                <button
                  type="button"
                  className="ind-action"
                  onClick={() => moveFaq(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  title="Move up"
                  style={{ padding: "4px 8px" }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="ind-action"
                  onClick={() => moveFaq(i, 1)}
                  disabled={i === draft.faq.length - 1}
                  aria-label="Move down"
                  title="Move down"
                  style={{ padding: "4px 8px" }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="ind-action"
                  onClick={() => removeFaq(i)}
                  disabled={draft.faq.length <= 4}
                  aria-label="Remove"
                  title={draft.faq.length <= 4 ? "Minimum 4 FAQ items" : "Remove"}
                  style={{ padding: "4px 8px" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="ind-action"
            onClick={addFaq}
            disabled={draft.faq.length >= 6}
            style={{ marginTop: 8 }}
          >
            {draft.faq.length >= 6 ? "Maximum 6 FAQ items" : "+ Add question"}
          </button>
        </div>

        {/* Section toggles */}
        <div className="form-section">
          <div className="form-section-h">Section visibility</div>
          {(
            [
              ["hero", "Hero"],
              ["problemPromise", "Problem → Promise"],
              ["plan", "Plan"],
              ["statsBand", "Stats band"],
              ["sampleProfile", "Sample profile"],
              ["testimonials", "Testimonials (hides if empty)"],
              ["apply", "Apply + FAQ"],
              ["founder", "Show founder block"],
            ] as [keyof Sections, string][]
          ).map(([k, label]) => (
            <ToggleSwitch
              key={k}
              label={label}
              checked={draft.sections[k]}
              onChange={(v) => updateSection(k, v)}
            />
          ))}
        </div>

        {/* Accent */}
        <div className="form-section" style={{ borderBottom: 0 }}>
          <div className="form-section-h">Accent</div>
          <AccentPicker
            value={draft.accent}
            onChange={(v) => update("accent", v as Industry["accent"])}
          />
        </div>

        {/* Save bar */}
        <div className="save-bar">
          <div className="save-bar-left">
            <span style={{ color: saving ? "var(--ink-400)" : "var(--green-700)" }}>●</span>
            {saveStatus}
          </div>
          <div className="save-bar-right">
            <button
              type="button"
              className={previewOpen ? "ind-action primary-soft" : "ind-action"}
              onClick={() => setPreviewOpen((v) => !v)}
              aria-pressed={previewOpen}
            >
              {previewOpen ? "Hide preview" : "Show preview"}
            </button>
            <a href={`/${draft.slug}`} className="ind-action" target="_blank" rel="noopener">
              Open in tab ↗
            </a>
            <button
              type="button"
              className="ind-action"
              onClick={() => autoSave(draft)}
              disabled={saving}
            >
              Save draft
            </button>
            <button
              type="button"
              className="ind-action primary"
              onClick={handlePublish}
              disabled={saving}
            >
              {isGenerated ? "Publish" : "Save & publish"}
            </button>
          </div>
        </div>
      </div>
      </div>
      {previewOpen && (
        <div className="edit-preview-pane">
          <div className="preview-toolbar">
            <div className="preview-toolbar-left">
              <span className={`preview-dot ${previewStale ? "stale" : "live"}`} aria-hidden />
              <span>{previewStale ? "Updating…" : "Live preview"}</span>
            </div>
            <div className="preview-toolbar-right">
              <a href={`/${draft.slug}`} target="_blank" rel="noopener" className="preview-toolbar-link">
                Open ↗
              </a>
              <button
                type="button"
                className="preview-toolbar-close"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
          </div>
          <iframe
            ref={previewIframeRef}
            src={`/preview/${draft.slug}`}
            className="preview-iframe"
            title="Live preview"
            onLoad={() => {
              previewReadyRef.current = false;
            }}
          />
        </div>
      )}
      </div>
    </div>
  );
}

function RegenButton({
  section,
  loading,
  onRegen,
}: {
  section: string;
  loading: boolean;
  onRegen: (s: string) => void;
}) {
  return (
    <button
      className="regen-btn"
      onClick={() => onRegen(section)}
      disabled={loading}
      type="button"
    >
      {loading ? "Generating…" : "✨ Regenerate"}
    </button>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}
