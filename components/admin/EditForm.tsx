"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Industry } from "@/config/schema";
import { ToggleSwitch } from "./ToggleSwitch";
import { AccentPicker } from "./AccentPicker";
import { PlaybookPanel } from "./PlaybookPanel";

interface EditFormProps {
  industry: Industry;
  isGenerated?: boolean;
}

type Sections = Industry["sections"];

export function EditForm({ industry: initial, isGenerated = false }: EditFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Industry>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [regenLoading, setRegenLoading] = useState<string | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  function update<K extends keyof Industry>(k: K, v: Industry[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    scheduleSave({ ...draft, [k]: v });
  }

  function updateNested<K extends keyof Industry>(k: K, subk: string, v: unknown) {
    setDraft((d) => ({ ...d, [k]: { ...(d[k] as object), [subk]: v } }));
    scheduleSave({ ...draft, [k]: { ...(draft[k] as object), [subk]: v } });
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
      setDraft((d) => ({ ...d, [section]: updated[section] }));
      setSavedAt(new Date());
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
    <div className="admin-main">
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
          <div className="field-row">
            <div className="field">
              <label>Short name (e.g. &ldquo;Attorney&rdquo;)</label>
              <input
                value={draft.industryShort}
                onChange={(e) => update("industryShort", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Plural name (optional)</label>
              <input
                value={draft.industryPlural ?? ""}
                onChange={(e) => update("industryPlural", e.target.value || undefined)}
                placeholder="e.g. Business Attorneys"
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>BD Profession ID</label>
              <input
                type="number"
                min={1}
                value={draft.professionId}
                onChange={(e) => update("professionId", parseInt(e.target.value, 10) || 0)}
              />
              <div className="field-hint">Maps to profession_id in the BD system</div>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="form-section">
          <div className="form-section-h">SEO</div>
          <div className="field">
            <label>Page title</label>
            <input
              value={draft.seo.title}
              onChange={(e) => updateNested("seo", "title", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Meta description (optional)</label>
            <textarea
              value={draft.seo.description ?? ""}
              onChange={(e) => updateNested("seo", "description", e.target.value || undefined)}
              style={{ minHeight: 60 }}
            />
          </div>
          <div className="field">
            <label>OG image URL (optional)</label>
            <input
              value={draft.seo.ogImage ?? ""}
              onChange={(e) => updateNested("seo", "ogImage", e.target.value || undefined)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Hero */}
        <div className="form-section">
          <div className="form-section-h">
            Hero
            <RegenButton section="hero" loading={regenLoading === "hero"} onRegen={regenerateSection} />
          </div>
          <div className="field">
            <label>Eyebrow text</label>
            <input
              value={draft.hero.eyebrow}
              onChange={(e) => updateNested("hero", "eyebrow", e.target.value)}
              placeholder="An Invitation — for Business Attorneys"
            />
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
          <div className="field-row">
            <div className="field">
              <label>Hero photo label</label>
              <input
                value={draft.hero.heroPhotoLabel}
                onChange={(e) => updateNested("hero", "heroPhotoLabel", e.target.value)}
                placeholder="ATTORNEY · ATLANTA, GA"
              />
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
        </div>

        {/* Problem / Villains */}
        <div className="form-section">
          <div className="form-section-h">
            Problem &amp; Villains
            <RegenButton section="problem" loading={regenLoading === "problem"} onRegen={regenerateSection} />
          </div>
          <div className="field">
            <label>Problem headline</label>
            <input
              value={draft.problem.headline}
              onChange={(e) => updateNested("problem", "headline", e.target.value)}
            />
          </div>
          {draft.problem.villains.map((v, i) => (
            <div key={i} className="villain-edit">
              <div className="villain-edit-num">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <input value={v.t} onChange={(e) => updateVillain(i, "t", e.target.value)} placeholder="Title" />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <textarea
                    value={v.b}
                    onChange={(e) => updateVillain(i, "b", e.target.value)}
                    style={{ minHeight: 50 }}
                    placeholder="Body"
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

        {/* Plan */}
        <div className="form-section">
          <div className="form-section-h">
            Plan (3 steps)
            <RegenButton section="plan" loading={regenLoading === "plan"} onRegen={regenerateSection} />
          </div>
          {draft.plan.map((step, i) => (
            <div key={i} className="villain-edit">
              <div className="villain-edit-num">{step.time || `Step 0${i + 1}`}</div>
              <div style={{ flex: 1 }}>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label>Step label</label>
                  <input
                    value={step.time}
                    onChange={(e) => {
                      const plan = [...draft.plan];
                      plan[i] = { ...plan[i], time: e.target.value };
                      update("plan", plan);
                    }}
                    placeholder="Step 01"
                  />
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label>Title</label>
                  <input
                    value={step.title}
                    onChange={(e) => {
                      const plan = [...draft.plan];
                      plan[i] = { ...plan[i], title: e.target.value };
                      update("plan", plan);
                    }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Body</label>
                  <textarea
                    value={step.body}
                    onChange={(e) => {
                      const plan = [...draft.plan];
                      plan[i] = { ...plan[i], body: e.target.value };
                      update("plan", plan);
                    }}
                    style={{ minHeight: 60 }}
                  />
                </div>
              </div>
            </div>
          ))}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            {draft.profile.stats.map((s, i) => (
              <div key={i}>
                <div className="field" style={{ marginBottom: 6 }}>
                  <label>Profile stat {i + 1} value</label>
                  <input
                    value={s.v}
                    onChange={(e) => {
                      const stats = [...draft.profile.stats];
                      stats[i] = { ...stats[i], v: e.target.value };
                      update("profile", { ...draft.profile, stats });
                    }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Profile stat {i + 1} label</label>
                  <input
                    value={s.l}
                    onChange={(e) => {
                      const stats = [...draft.profile.stats];
                      stats[i] = { ...stats[i], l: e.target.value };
                      update("profile", { ...draft.profile, stats });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats band */}
        <div className="form-section">
          <div className="form-section-h">Stats band (optional)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {(draft.statsBand ?? [{v:"",l:""},{v:"",l:""},{v:"",l:""}]).map((s, i) => (
              <div key={i}>
                <div className="field" style={{ marginBottom: 6 }}>
                  <label>Band stat {i + 1} value</label>
                  <input
                    value={s.v}
                    onChange={(e) => {
                      const band = [...(draft.statsBand ?? [{v:"",l:""},{v:"",l:""},{v:"",l:""}])];
                      band[i] = { ...band[i], v: e.target.value };
                      update("statsBand", band);
                    }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Band stat {i + 1} label</label>
                  <input
                    value={s.l}
                    onChange={(e) => {
                      const band = [...(draft.statsBand ?? [{v:"",l:""},{v:"",l:""},{v:"",l:""}])];
                      band[i] = { ...band[i], l: e.target.value };
                      update("statsBand", band);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="form-section">
          <div className="form-section-h">Testimonials ({draft.testimonials.length})</div>
          {draft.testimonials.map((t, i) => (
            <div key={i} className="villain-edit" style={{ alignItems: "flex-start" }}>
              <div className="villain-edit-num">{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1 }}>
                <div className="field" style={{ marginBottom: 8 }}>
                  <label>Quote</label>
                  <textarea
                    value={t.quote}
                    onChange={(e) => {
                      const arr = [...draft.testimonials];
                      arr[i] = { ...arr[i], quote: e.target.value };
                      update("testimonials", arr);
                    }}
                    style={{ minHeight: 60 }}
                  />
                </div>
                <div className="field-row">
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Name</label>
                    <input
                      value={t.name}
                      onChange={(e) => {
                        const arr = [...draft.testimonials];
                        arr[i] = { ...arr[i], name: e.target.value };
                        update("testimonials", arr);
                      }}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Role</label>
                    <input
                      value={t.role}
                      onChange={(e) => {
                        const arr = [...draft.testimonials];
                        arr[i] = { ...arr[i], role: e.target.value };
                        update("testimonials", arr);
                      }}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Company (optional)</label>
                    <input
                      value={t.company ?? ""}
                      onChange={(e) => {
                        const arr = [...draft.testimonials];
                        arr[i] = { ...arr[i], company: e.target.value || undefined };
                        update("testimonials", arr);
                      }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const arr = draft.testimonials.filter((_, j) => j !== i);
                  update("testimonials", arr);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", fontSize: 18, padding: "0 4px", marginLeft: 8 }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ind-action"
            style={{ marginTop: 8 }}
            onClick={() => {
              update("testimonials", [...draft.testimonials, { quote: "", name: "", role: "", company: undefined }]);
            }}
          >
            + Add testimonial
          </button>
        </div>

        {/* FAQ */}
        <div className="form-section">
          <div className="form-section-h">
            FAQ ({draft.faq.length})
            <RegenButton section="faq" loading={regenLoading === "faq"} onRegen={regenerateSection} />
          </div>
          {draft.faq.map((f, i) => (
            <div key={i} className="villain-edit">
              <div className="villain-edit-num">{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1 }}>
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
              {draft.faq.length > 4 && (
                <button
                  type="button"
                  onClick={() => {
                    const arr = draft.faq.filter((_, j) => j !== i);
                    update("faq", arr);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", fontSize: 18, padding: "0 4px", marginLeft: 8 }}
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {draft.faq.length < 6 && (
            <button
              type="button"
              className="ind-action"
              style={{ marginTop: 8 }}
              onClick={() => update("faq", [...draft.faq, { q: "", a: "" }])}
            >
              + Add FAQ item
            </button>
          )}
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
          <ToggleSwitch
            label="Show founder bio block"
            checked={draft.showFounder}
            onChange={(v) => update("showFounder", v)}
          />
        </div>

        {/* Accent */}
        <div className="form-section">
          <div className="form-section-h">Accent</div>
          <AccentPicker
            value={draft.accent}
            onChange={(v) => update("accent", v as Industry["accent"])}
          />
        </div>

        {/* Provider Playbook */}
        <div style={{ borderBottom: 0 }}>
          <PlaybookPanel slug={draft.slug} initialPlaybook={draft.playbook} />
        </div>

        {/* Save bar */}
        <div className="save-bar">
          <div className="save-bar-left">
            <span style={{ color: saving ? "var(--ink-400)" : "var(--green-700)" }}>●</span>
            {saveStatus}
          </div>
          <div className="save-bar-right">
            <a href={`/${draft.slug}`} className="ind-action" target="_blank" rel="noopener">
              Preview
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
