"use client";
import { useEffect, useRef, useState } from "react";

interface PlaybookFormProps {
  industrySlug: string;
  turnstileSiteKey: string | null;
  onClose: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function PlaybookForm({
  industrySlug,
  turnstileSiteKey,
  onClose,
}: PlaybookFormProps) {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Lock scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Load Turnstile script + render widget
  useEffect(() => {
    if (!turnstileSiteKey) return;

    function renderWidget() {
      if (!turnstileContainerRef.current || !window.turnstile) return;
      if (turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: turnstileSiteKey!,
          callback: (token) => setTurnstileToken(token),
          "error-callback": () => setTurnstileToken(null),
          "expired-callback": () => setTurnstileToken(null),
          theme: "light",
        },
      );
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", renderWidget, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderWidget, { once: true });
    document.head.appendChild(script);

    return () => {
      const id = turnstileWidgetIdRef.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // ignore
        }
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [turnstileSiteKey]);

  function update<K extends keyof typeof data>(
    key: K,
    value: (typeof data)[K],
  ) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!data.consent) {
      setError("Please agree to the consent statement to continue.");
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setError("Please complete the bot check before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/playbook-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          consent: data.consent,
          industrySlug,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        downloadUrl?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !payload.ok || !payload.downloadUrl) {
        const baseError = payload.error ?? "Submission failed. Please try again.";
        setError(payload.detail ? `${baseError} (${payload.detail})` : baseError);
        if (turnstileWidgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(turnstileWidgetIdRef.current);
          } catch {
            // ignore
          }
        }
        setTurnstileToken(null);
        return;
      }
      setSuccess(true);
      window.location.href = payload.downloadUrl;
    } catch (err) {
      console.error("[PlaybookForm] submit failed:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="playbook-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="playbook-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="playbook-modal" ref={dialogRef}>
        <button
          type="button"
          className="playbook-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {success ? (
          <div className="playbook-modal-success">
            <h2 id="playbook-modal-title" className="serif">
              Your download is starting.
            </h2>
            <p>
              Thanks — keep an eye on your downloads folder. We&rsquo;ve also
              logged your details so a member of our team can reach out if it
              would help.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="playbook-modal-head">
              <span className="eyebrow">
                <span className="dot" />
                Provider Playbook
              </span>
              <h2 id="playbook-modal-title" className="serif">
                Get the playbook.
              </h2>
              <p className="playbook-modal-sub">
                A few details and we&rsquo;ll send you straight to the download.
              </p>
            </div>

            <form onSubmit={submit} className="form-body">
              <div className="form-row">
                <label>
                  First name
                  <input
                    required
                    value={data.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    placeholder="Jane"
                    autoComplete="given-name"
                  />
                </label>
                <label>
                  Last name
                  <input
                    required
                    value={data.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    placeholder="Reeves"
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Email
                  <input
                    required
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jane@firm.com"
                    autoComplete="email"
                  />
                </label>
                <label>
                  Phone
                  <input
                    required
                    type="tel"
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                  />
                </label>
              </div>

              <label className="playbook-consent">
                <input
                  type="checkbox"
                  checked={data.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  required
                />
                <span>
                  I agree that Find a Business Pro may contact me by email,
                  phone, or text about the playbook and related services. Message
                  and data rates may apply. I can opt out at any time.
                </span>
              </label>

              {turnstileSiteKey && (
                <div
                  ref={turnstileContainerRef}
                  className="playbook-turnstile"
                />
              )}

              {error && <div className="playbook-error">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-lg form-submit"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Get the playbook"}
                {!submitting && <span className="arr">→</span>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
