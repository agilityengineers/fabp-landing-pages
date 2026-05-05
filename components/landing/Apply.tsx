"use client";
import { useState } from "react";
import type { Industry, Base } from "@/config/schema";

interface ApplyProps {
  cfg: Industry;
  base: Base;
  showFounder: boolean;
}

export function Apply({ cfg, base, showFounder }: ApplyProps) {
  const [openFaq, setOpenFaq] = useState(0);
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: "",
    lastName: "",
    company: "",
    state: "",
    email: "",
    phone: "",
    profession: cfg.industry,
    city: "",
    years: "",
    website: "",
    spend: "",
    fit: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update(k: string, v: string) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (!data.name || !data.lastName || !data.company || !data.state || !data.email || !data.profession || !data.city) return;
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, industrySlug: cfg.slug, submittedAt: new Date().toISOString() }),
      });
    } catch {
      // silently continue — show thank-you regardless
    }
    setSubmitted(true);
    setSubmitting(false);
  }

  const ref = Math.floor(Math.random() * 9000 + 1000);

  return (
    <section className="apply" id="apply">
      <div className="container apply-grid">
        <div className="apply-copy">
          <span className="eyebrow">
            <span className="dot" />
            Your invitation
          </span>
          <h2 className="serif">
            The directory business owners trust is opening{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent-deep)" }}>one seat</em> in your
            category.
          </h2>
          <p className="apply-sub">
            Apply for a 15-minute intro call. If we&rsquo;re a fit, you&rsquo;ll be invited to the
            Brand Voice Interview — the process from <em>Marketing Mayhem</em>.
          </p>

          <div className="apply-faq">
            {cfg.faq.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`apply-faq-item${isOpen ? " open" : ""}`}>
                  <button
                    className="apply-faq-q"
                    onClick={() => setOpenFaq(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="apply-faq-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="apply-faq-q-text">{f.q}</span>
                    <span className="apply-faq-chev" aria-hidden="true">+</span>
                  </button>
                  <div className="apply-faq-a-wrap">
                    <div className="apply-faq-a">{f.a}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <a
            className="directory-link"
            href={base.brand.parentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <b>Not ready?</b> Browse the live directory{" "}
            <span className="arr">→</span>
          </a>

          {showFounder && (
            <div className="founder-block">
              <div className="founder-eyebrow">A note from the founder</div>
              <div className="founder-row">
                <div className="founder-photo" aria-hidden="true">
                  <div className="founder-photo-inner">
                    <div className="founder-photo-mono">
                      PORTRAIT ·{" "}
                      {base.founder.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  </div>
                </div>
                <div className="founder-meta">
                  <div className="founder-name serif">{base.founder.name}</div>
                  <div className="founder-title">{base.founder.title}</div>
                  <div className="founder-book">{base.founder.book}</div>
                </div>
              </div>
              <p className="founder-bio">{base.founder.bio}</p>
            </div>
          )}
        </div>

        <div className="form-card">
          <div className="form-head">
            <div className="form-step">
              Step {submitted ? 2 : step} / 2
            </div>
            <div className="form-progress">
              <div
                className="form-progress-fill"
                style={{ width: submitted ? "100%" : step === 1 ? "50%" : "100%" }}
              />
            </div>
          </div>

          {submitted ? (
            <div className="form-thanks">
              <div className="form-thanks-mark">
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M10 16.5l4 4 8-9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="serif">Application received.</h3>
              <p>
                We&rsquo;ll review and reach out within two business days to schedule your
                15-minute intro call.
              </p>
              <p>
                You&rsquo;ll also receive a welcome email shortly with sign-in details for
                your member account.
              </p>
              <div className="form-thanks-meta">REF · APP-{ref}</div>
              {cfg.sections.featuredOffer ? (
                <a
                  className="form-thanks-link"
                  href={cfg.featuredOffer?.brandVoiceInterviewUrl ?? base.links.brandVoiceInterviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Continue to your Brand Voice Interview →
                </a>
              ) : (
                <a
                  className="form-thanks-link"
                  href={base.brand.parentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  While you wait, browse the directory →
                </a>
              )}
            </div>
          ) : step === 1 ? (
            <form onSubmit={next} className="form-body">
              <div className="form-row">
                <label>
                  First name
                  <input
                    required
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jane"
                  />
                </label>
                <label>
                  Last name
                  <input
                    required
                    value={data.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    placeholder="Reeves"
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
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(555) 555-5555"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Company name
                  <input
                    required
                    value={data.company}
                    onChange={(e) => update("company", e.target.value)}
                    placeholder="Reeves & Associates"
                  />
                </label>
                <label>
                  Profession
                  <input
                    required
                    value={data.profession}
                    onChange={(e) => update("profession", e.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  City / metro served
                  <input
                    required
                    value={data.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Charlotte"
                  />
                </label>
                <label>
                  State (service area)
                  <input
                    required
                    value={data.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="NC"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-lg form-submit">
                Continue
                <span className="arr">→</span>
              </button>
              <p className="form-foot">7 fields now · 4 more on the next step</p>
            </form>
          ) : (
            <form onSubmit={submit} className="form-body">
              <div className="form-row">
                <label>
                  Years in practice
                  <input
                    value={data.years}
                    onChange={(e) => update("years", e.target.value)}
                    placeholder="12"
                  />
                </label>
                <label>
                  Website / LinkedIn
                  <input
                    value={data.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="firm.com"
                  />
                </label>
              </div>
              <label>
                Current monthly marketing spend
                <select value={data.spend} onChange={(e) => update("spend", e.target.value)}>
                  <option value="">Select a range…</option>
                  <option>$0 – $1,000</option>
                  <option>$1,000 – $5,000</option>
                  <option>$5,000 – $15,000</option>
                  <option>$15,000 – $50,000</option>
                  <option>$50,000+</option>
                </select>
              </label>
              <label>
                Why you&rsquo;d be a fit
                <textarea
                  rows={3}
                  value={data.fit}
                  onChange={(e) => update("fit", e.target.value)}
                  placeholder="Briefly: who you serve, what's working, what's not."
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg form-submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit application"}
                  {!submitting && <span className="arr">→</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
