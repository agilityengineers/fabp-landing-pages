"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "industry-name";
}

export function ManualCreateForm() {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [industryShort, setIndustryShort] = useState("");
  const [industryPlural, setIndustryPlural] = useState("");
  const [professionId, setProfessionId] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const slug = customSlug.trim() || slugify(industry);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const pid = parseInt(professionId, 10);
    if (!industry.trim() || !industryShort.trim() || !pid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/industries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          industry: industry.trim(),
          industryShort: industryShort.trim(),
          industryPlural: industryPlural.trim() || undefined,
          professionId: pid,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Create failed (${res.status})`);
      }
      router.push(`/admin/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const canSubmit =
    industry.trim() &&
    industryShort.trim() &&
    parseInt(professionId, 10) > 0 &&
    !loading;

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <a href="/admin" className="ind-action" style={{ marginBottom: 10, display: "inline-flex" }}>
            ← Industries
          </a>
          <h1 className="admin-h1">New industry — manual</h1>
          <p className="admin-sub">Fill in the identifiers. You&rsquo;ll edit all content on the next screen.</p>
        </div>
      </div>
      <div className="admin-card gen-card">
        {loading ? (
          <div className="gen-loading">
            <div className="gen-step">Creating industry…</div>
            <div className="gen-loading-bar" />
            <div className="gen-loading-text">Setting up config file with defaults</div>
          </div>
        ) : (
          <form onSubmit={handleCreate}>
            <div className="gen-step">Manual entry</div>
            <h2 className="gen-h2">Industry identifiers</h2>
            <p className="gen-p">
              Provide the key identifiers below. Every other field — headlines, villains,
              plan steps, FAQ — will be pre-filled with placeholder text you can edit.
            </p>

            {error && (
              <div className="login-err" style={{ marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            <div className="field-row">
              <div className="field">
                <label>Industry name <span style={{ color: "var(--ink-400)" }}>*</span></label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Business Attorneys"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Short name <span style={{ color: "var(--ink-400)" }}>*</span></label>
                <input
                  value={industryShort}
                  onChange={(e) => setIndustryShort(e.target.value)}
                  placeholder="Attorney"
                  required
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Plural name <span style={{ color: "var(--ink-400)", fontSize: 12 }}>(optional)</span></label>
                <input
                  value={industryPlural}
                  onChange={(e) => setIndustryPlural(e.target.value)}
                  placeholder="Business Attorneys"
                />
              </div>
              <div className="field">
                <label>BD Profession ID <span style={{ color: "var(--ink-400)" }}>*</span></label>
                <input
                  type="number"
                  min={1}
                  value={professionId}
                  onChange={(e) => setProfessionId(e.target.value)}
                  placeholder="e.g. 3"
                  required
                />
                <div className="field-hint">Maps to profession_id in the BD system</div>
              </div>
            </div>

            <div className="field">
              <label>Slug <span style={{ color: "var(--ink-400)", fontSize: 12 }}>(leave blank to auto-generate)</span></label>
              <input
                value={customSlug}
                onChange={(e) =>
                  setCustomSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/--+/g, "-")
                      .replace(/^-+|-+$/g, "")
                  )
                }
                placeholder={slugify(industry) || "business-attorneys"}
              />
              <div className="field-hint">
                Will be saved as{" "}
                <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>/{slug}</span>
              </div>
            </div>

            <button
              className="gen-cta"
              type="submit"
              disabled={!canSubmit}
            >
              Create industry page
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
