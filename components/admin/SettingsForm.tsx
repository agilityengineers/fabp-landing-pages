"use client";

import { useState, useCallback, useRef } from "react";
import type { Base } from "@/config/schema";

interface SettingsFormProps {
  base: Base;
}

export function SettingsForm({ base: initial }: SettingsFormProps) {
  const [draft, setDraft] = useState<Base>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  function updateBrand(key: keyof Base["brand"], value: string) {
    const next = { ...draft, brand: { ...draft.brand, [key]: value } };
    setDraft(next);
    scheduleSave(next);
  }

  function updateFounder(key: keyof Base["founder"], value: string) {
    const next = { ...draft, founder: { ...draft.founder, [key]: value } };
    setDraft(next);
    scheduleSave(next);
  }

  const scheduleSave = useCallback((data: Base) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave(data), 800);
  }, []);

  async function autoSave(data: Base) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/base", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Save failed");
      } else {
        setSavedAt(new Date());
      }
    } catch {
      setError("Network error — changes not saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-main">
      <div className="admin-bar">
        <div>
          <h1 className="admin-h1">Brand &amp; Founder</h1>
          <p className="admin-sub">Global settings shared across all industry pages.</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: "oklch(95% 0.06 25)",
          border: "0.5px solid oklch(80% 0.1 25)",
          borderRadius: "var(--r-sm)",
          padding: "10px 14px",
          color: "oklch(35% 0.15 25)",
          fontSize: 13.5,
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="form-section">
          <p className="form-section-h">Brand</p>
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
                type="url"
                value={draft.brand.parentUrl}
                onChange={(e) => updateBrand("parentUrl", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input
                value={draft.brand.phone}
                onChange={(e) => updateBrand("phone", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="form-section">
          <p className="form-section-h">Founder</p>
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
          <div className="field-row">
            <div className="field">
              <label>Book / byline</label>
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
              <span className="field-hint">e.g. FOUNDER · CHARLOTTE, NC</span>
            </div>
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea
              style={{ minHeight: 120 }}
              value={draft.founder.bio}
              onChange={(e) => updateFounder("bio", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="save-bar" style={{ marginTop: 0 }}>
        <div className="save-bar-left">
          {saving && <span>Saving…</span>}
          {!saving && savedAt && (
            <span>Saved at {savedAt.toLocaleTimeString()}</span>
          )}
          {!saving && !savedAt && <span>Changes auto-save</span>}
        </div>
        <button
          className="gen-cta"
          disabled={saving}
          onClick={() => autoSave(draft)}
        >
          {saving ? "Saving…" : "Save now"}
        </button>
      </div>
    </div>
  );
}
