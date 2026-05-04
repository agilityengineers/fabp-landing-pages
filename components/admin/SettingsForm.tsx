"use client";
import { useState } from "react";
import type { Base } from "@/config/schema";

interface SettingsFormProps {
  initial: Base;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [draft, setDraft] = useState<Base>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function updateBrand<K extends keyof Base["brand"]>(k: K, v: Base["brand"][K]) {
    setDraft((d) => ({ ...d, brand: { ...d.brand, [k]: v } }));
  }

  function updateFounder<K extends keyof Base["founder"]>(k: K, v: Base["founder"][K]) {
    setDraft((d) => ({ ...d, founder: { ...d.founder, [k]: v } }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/base", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Save failed (${res.status})`);
      }
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <h1 className="admin-h1">Brand &amp; Founder</h1>
          <p className="admin-sub">
            Brand-wide constants shared across every industry landing page.
          </p>
        </div>
      </div>

      {error && (
        <div className="login-err" style={{ marginBottom: 16 }}>
          ⚠️ {error}{" "}
          <button
            onClick={() => setError("")}
            style={{
              marginLeft: 8,
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="admin-card">
        <div className="form-section">
          <div className="form-section-h">Brand</div>
          <div className="field">
            <label>Brand name</label>
            <input
              value={draft.brand.name}
              onChange={(e) => updateBrand("name", e.target.value)}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Parent URL</label>
              <input
                value={draft.brand.parentUrl}
                onChange={(e) => updateBrand("parentUrl", e.target.value)}
                placeholder="https://www.findabusinesspro.com"
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                value={draft.brand.phone}
                onChange={(e) => updateBrand("phone", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section" style={{ borderBottom: 0 }}>
          <div className="form-section-h">Founder</div>
          <div className="field-row">
            <div className="field">
              <label>Name</label>
              <input
                value={draft.founder.name}
                onChange={(e) => updateFounder("name", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Title</label>
              <input
                value={draft.founder.title}
                onChange={(e) => updateFounder("title", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea
              value={draft.founder.bio}
              onChange={(e) => updateFounder("bio", e.target.value)}
              style={{ minHeight: 120 }}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Book line</label>
              <input
                value={draft.founder.book}
                onChange={(e) => updateFounder("book", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Photo label</label>
              <input
                value={draft.founder.photoLabel}
                onChange={(e) => updateFounder("photoLabel", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="save-bar">
          <div className="save-bar-left">
            <span style={{ color: saving ? "var(--ink-400)" : "var(--green-700)" }}>●</span>
            {saving
              ? "Saving…"
              : savedAt
              ? `Saved · ${formatRelative(savedAt)}`
              : "Unsaved changes"}
          </div>
          <div className="save-bar-right">
            <button
              type="button"
              className="ind-action primary"
              onClick={save}
              disabled={saving}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}
