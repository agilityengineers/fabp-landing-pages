"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function GeneratorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "industry-name";

  async function generate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, notes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Generation failed (${res.status})`);
      }
      const { slug: newSlug } = await res.json();
      router.push(`/admin/${newSlug}?generated=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <a href="/admin" className="ind-action" style={{ marginBottom: 10, display: "inline-flex" }}>
            ← Industries
          </a>
          <h1 className="admin-h1">New industry</h1>
          <p className="admin-sub">Step 1 of 2 · Tell us the industry — Claude drafts the page.</p>
        </div>
      </div>
      <div className="admin-card gen-card">
        {loading ? (
          <div className="gen-loading">
            <div className="gen-step">✨ Generating with Claude claude-opus-4-7</div>
            <div className="gen-loading-bar" />
            <div className="gen-loading-text">
              Drafting headlines · villains · promise · plan · sample profile · FAQ
            </div>
          </div>
        ) : (
          <>
            <div className="gen-step">Step 1 / 2</div>
            <h2 className="gen-h2">What industry are you adding?</h2>
            <p className="gen-p">
              Type the profession name as you&rsquo;d say it on a podcast. Claude will draft the
              entire landing page in your voice — you&rsquo;ll review and edit before anything ships.
            </p>

            {error && (
              <div className="login-err" style={{ marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            <div className="field">
              <label>Industry name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Commercial Real Estate Brokers"
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
              <div className="field-hint">
                Slug auto-generates:{" "}
                <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>/{slug}</span>
              </div>
            </div>
            <div className="field">
              <label>Anything specific to mention? (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. focus on industrial & flex space, mid-market deal sizes, key pain is sourcing institutional buyers"
              />
              <div className="field-hint">
                Pricing band, target metro, niche, key pain points — anything you want Claude to
                weave in.
              </div>
            </div>
            <button className="gen-cta" onClick={generate} disabled={!name.trim()}>
              <span>✨</span> Generate draft with Claude
            </button>
          </>
        )}
      </div>
    </div>
  );
}
