"use client";

import { useEffect, useState } from "react";

type Target = {
  key: "alerts" | "playbook";
  envVar: string;
  label: string;
  configured: boolean;
};

type Result = { ok: boolean; message?: string; error?: string };

export function SlackTestPanel() {
  const [targets, setTargets] = useState<Target[] | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/slack-test")
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!cancelled) setTargets(j.targets);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e?.message ?? "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function send(key: Target["key"]) {
    setBusyKey(key);
    setResults((prev) => ({ ...prev, [key]: { ok: false } }));
    try {
      const res = await fetch("/api/admin/slack-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: key }),
      });
      const j = (await res.json()) as Result;
      setResults((prev) => ({ ...prev, [key]: j }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [key]: {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
      }));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="admin-card" style={{ marginBottom: 24 }}>
      <div className="form-section">
        <p className="form-section-h">Slack notifications</p>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--ink-500)",
            marginTop: -4,
            marginBottom: 16,
          }}
        >
          Test that each Slack incoming webhook is wired correctly. Messages
          are sent in real time — check the corresponding Slack channel after
          clicking.
        </p>

        {loadError && (
          <div
            style={{
              background: "oklch(95% 0.06 25)",
              border: "0.5px solid oklch(80% 0.1 25)",
              borderRadius: "var(--r-sm)",
              padding: "10px 14px",
              color: "oklch(35% 0.15 25)",
              fontSize: 13.5,
              marginBottom: 12,
            }}
          >
            Could not load Slack settings: {loadError}
          </div>
        )}

        {targets?.map((t) => {
          const result = results[t.key];
          const isBusy = busyKey === t.key;
          return (
            <div
              key={t.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                padding: "14px 0",
                borderTop: "0.5px solid var(--rule)",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink-500)",
                    marginTop: 2,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  {t.envVar}
                </div>
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  {t.configured ? (
                    <span style={{ color: "oklch(45% 0.12 145)" }}>
                      ● Secret is set
                    </span>
                  ) : (
                    <span style={{ color: "oklch(45% 0.15 60)" }}>
                      ● Secret not set — add it in Replit Secrets and restart
                    </span>
                  )}
                </div>
                {result?.message && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: "oklch(35% 0.12 145)",
                    }}
                  >
                    ✓ {result.message}
                  </div>
                )}
                {result && !result.ok && result.error && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: "oklch(40% 0.15 25)",
                    }}
                  >
                    ✗ {result.error}
                  </div>
                )}
              </div>
              <button
                className="gen-cta"
                disabled={!t.configured || isBusy}
                onClick={() => send(t.key)}
                style={{ flexShrink: 0 }}
              >
                {isBusy ? "Sending…" : "Send test"}
              </button>
            </div>
          );
        })}

        {!targets && !loadError && (
          <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Loading…</div>
        )}
      </div>
    </div>
  );
}
