// components.jsx — slim landing-page sections (4 only: Nav/Hero/ProblemPromise/Plan/Apply/Footer)

const { useState, useEffect, useRef } = React;

function Reveal({ children, delay = 0, as: Tag = "div", className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>;
}

/* ── NAV ── */
function TopNav({ cfg, base, currentIndustry, onSwitchIndustry, onCta, scrolled }) {
  return (
    <header className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <a className="brand" href="#top" aria-label="Find a Business Pro">
          <img src="assets/fabp-logo.png" alt="Find a Business Pro" className="brand-logo" />
        </a>
        <div className="nav-right">
          <select
            className="industry-pill"
            value={currentIndustry}
            onChange={(e) => onSwitchIndustry(e.target.value)}
            aria-label="Switch industry preview"
          >
            {Object.keys(INDUSTRIES).map((k) => (
              <option key={k} value={k}>{INDUSTRIES[k].industry}</option>
            ))}
          </select>
          <a className="back-to-main" href={base.brand.parentUrl} target="_blank" rel="noopener">
            Visit the directory <span className="arr">→</span>
          </a>
          <button className="btn btn-primary nav-cta" onClick={onCta}>
            {cfg.hero.primaryCta}<span className="arr">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── HERO ── */
function Hero({ cfg, onCta, onSecondary }) {
  const sp = cfg.profile;
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden />
      <div className="hero-grid">
        <div>
          <Reveal>
            <span className="eyebrow"><span className="dot" />{cfg.hero.eyebrow}</span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="hero-headline serif" dangerouslySetInnerHTML={{ __html: cfg.hero.headline }} />
          </Reveal>
          <Reveal delay={150}>
            <p className="hero-sub">{cfg.hero.subhead}</p>
          </Reveal>
          <Reveal delay={220} className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={onCta}>{cfg.hero.primaryCta}<span className="arr">→</span></button>
            <button className="btn btn-ghost btn-lg" onClick={onSecondary}>↓ {cfg.hero.secondaryCta}</button>
          </Reveal>
          <Reveal delay={300} className="hero-meta">
            <span className="meta-item"><span className="meta-dot green" />Category-exclusive per metro</span>
            <span className="meta-item"><span className="meta-dot" />Founder-led onboarding</span>
            <span className="meta-item"><span className="meta-dot green" />No per-lead fees</span>
          </Reveal>
        </div>

        <Reveal delay={120} className="hero-stage">
          <div className="hero-photo">
            <img src={cfg.hero.heroImage} alt="" loading="eager" />
            <div className="photo-frame">
              <div className="photo-corner tl" />
              <div className="photo-corner tr" />
              <div className="photo-corner bl" />
              <div className="photo-corner br" />
            </div>
            <div className="hero-photo-label">{cfg.hero.heroPhotoLabel}</div>
          </div>
          <div className="hero-card-float">
            <div className="hcf-row">
              <div className="hcf-avatar">{(sp.name || "")[0]}</div>
              <div className="hcf-id">
                <div className="hcf-name">{sp.name}</div>
                <div className="hcf-role">{sp.role}</div>
              </div>
              <span className="hcf-badge">Listed</span>
            </div>
            <div className="hcf-stats">
              {sp.stats.map((s, i) => (
                <div key={i}><div className="hcf-stat-v serif">{s.v}</div><div className="hcf-stat-l">{s.l}</div></div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── PROBLEM → PROMISE ── */
function ProblemPromise({ cfg }) {
  return (
    <section className="problem-promise">
      <div className="container pp-grid">
        <div>
          <Reveal>
            <span className="eyebrow pp-eyebrow"><span className="dot" />The villain</span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="pp-headline serif">You didn't earn the credentials to become <em>a marketer</em>.</h2>
          </Reveal>
          <div className="villains">
            {cfg.problem.villains.map((v, i) => (
              <Reveal key={i} delay={i * 60} className="villain-row">
                <div className="villain-num">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <strong>{v.t}</strong>
                  <p>{v.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={120} className="promise">
          <div className="promise-eyebrow">The promise</div>
          <div className="promise-text serif">{cfg.promise.headline}</div>
          <div className="promise-meta">
            {cfg.promise.stats.map((s, i) => (
              <div key={i} className="promise-stat">
                <div className="promise-stat-v serif">{s.v}</div>
                <div className="promise-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── PLAN ── */
function Plan({ cfg }) {
  return (
    <section className="plan" id="plan">
      <div className="container">
        <div className="plan-head">
          <div>
            <span className="eyebrow"><span className="dot" />The plan</span>
            <h2 className="serif">Three steps. <em style={{ color: "var(--accent-deep)", fontStyle: "italic" }}>No mayhem.</em></h2>
          </div>
          <p className="lead">From the framework behind <em>Marketing Mayhem</em> — the same Brand Voice Interview process that takes a generalist practice and sharpens it into a clear ICP the market can find.</p>
        </div>
        <div className="plan-track">
          {cfg.plan.map((s, i) => (
            <Reveal key={i} delay={i * 100} className="plan-step">
              <div className="plan-step-head">
                <div className="plan-num serif">{String(i + 1).padStart(2, "0")}</div>
                <div className="plan-bar" />
                <div className="plan-time">{s.time}</div>
              </div>
              <h3 className="plan-title">{s.title}</h3>
              <p className="plan-body">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FOUNDER (toggleable, lives inside Apply column) ── */
function FounderBlock({ founder }) {
  return (
    <div className="founder-block">
      <div className="founder-eyebrow">A note from the founder</div>
      <div className="founder-row">
        <div className="founder-photo" aria-hidden>
          <div className="founder-photo-inner">
            <div className="founder-photo-mono">PORTRAIT · {founder.name.split(" ").map(n => n[0]).join("")}</div>
          </div>
          <div className="founder-photo-frame">
            <div className="photo-corner tl" /><div className="photo-corner tr" />
            <div className="photo-corner bl" /><div className="photo-corner br" />
          </div>
        </div>
        <div className="founder-meta">
          <div className="founder-name serif">{founder.name}</div>
          <div className="founder-title">{founder.title}</div>
          <div className="founder-book">{founder.book}</div>
        </div>
      </div>
      <p className="founder-bio">{founder.bio}</p>
    </div>
  );
}

/* ── STATS BAND (toggleable) ── */
function StatsBand({ cfg }) {
  const stats = cfg.statsBand || [];
  if (!stats.length) return null;
  return (
    <section className="stats-band">
      <div className="container stats-band-inner">
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 80} className="stats-band-cell">
            <div className="stats-band-v serif">{s.v}</div>
            <div className="stats-band-l">{s.l}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── SAMPLE PROFILE (toggleable, expanded preview) ── */
function SampleProfile({ cfg }) {
  const sp = cfg.profile;
  const ex = cfg.sampleProfileExpanded || { headline: "This is what your listing looks like.", sub: "", bullets: [] };
  return (
    <section className="sample-profile">
      <div className="container sample-grid">
        <Reveal>
          <span className="eyebrow"><span className="dot" />Sample listing</span>
          <h2 className="serif sample-h">{ex.headline}</h2>
          <p className="sample-sub">{ex.sub}</p>
          <ul className="sample-bullets">
            {ex.bullets.map((b, i) => (
              <li key={i}>
                <span className="check"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.5 3.5 6.5-7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120} className="browser-mock">
          <div className="bm-chrome">
            <div className="bm-dots"><span /><span /><span /></div>
            <div className="bm-url">findabusinesspro.com / {cfg.industry.toLowerCase().replace(/\s+/g, "-")} / {sp.city.toLowerCase().split(",")[0].replace(/\s+/g, "-")}</div>
          </div>
          <div className="bm-body">
            <div className="bm-hero">
              <div className="bm-avatar">{sp.name[0]}</div>
              <div className="bm-id">
                <div className="bm-name serif">{sp.name}</div>
                <div className="bm-role">{sp.role} · {sp.city}</div>
              </div>
              <span className="hcf-badge">Listed</span>
            </div>
            <div className="bm-stats">
              {sp.stats.map((s, i) => (
                <div key={i}><div className="bm-stat-v serif">{s.v}</div><div className="bm-stat-l">{s.l}</div></div>
              ))}
            </div>
            <div className="bm-section">
              <div className="bm-label">About</div>
              <div className="bm-line w90" /><div className="bm-line w95" /><div className="bm-line w70" />
            </div>
            <div className="bm-section">
              <div className="bm-label">Specialties</div>
              <div className="bm-tags">
                <span>Tax strategy</span><span>Outsourced CFO</span><span>R&amp;D credits</span><span>Multi-entity</span>
              </div>
            </div>
            <button className="bm-cta">Request a consultation →</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS (renders only if quotes exist) ── */
function Testimonials({ cfg }) {
  const quotes = cfg.testimonials || [];
  if (!quotes.length) return null;
  return (
    <section className="testimonials">
      <div className="container">
        <Reveal>
          <span className="eyebrow"><span className="dot" />From listed pros</span>
        </Reveal>
        <div className="testimonial-grid">
          {quotes.map((q, i) => (
            <Reveal key={i} delay={i * 80} className="testimonial">
              <div className="testimonial-quote serif">&ldquo;{q.quote}&rdquo;</div>
              <div className="testimonial-meta">
                <div className="testimonial-name">{q.name}</div>
                <div className="testimonial-role">{q.role}{q.company ? ` · ${q.company}` : ""}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── APPLY (final CTA + form + compact FAQ) ── */
function Apply({ cfg, base, showFounder }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", email: "", phone: "", profession: cfg.industry, city: "", years: "", website: "", spend: "", fit: "" });
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { setData((d) => ({ ...d, profession: cfg.industry })); }, [cfg.industry]);
  function update(k, v) { setData((d) => ({ ...d, [k]: v })); }
  function next(e) { e.preventDefault(); if (!data.name || !data.email || !data.profession || !data.city) return; setStep(2); }
  function submit(e) { e.preventDefault(); setSubmitted(true); }

  return (
    <section className="apply" id="apply">
      <div className="container apply-grid">
        <div className="apply-copy">
          <span className="eyebrow"><span className="dot" />Your invitation</span>
          <h2 className="serif">The directory business owners trust is opening <em style={{ fontStyle: "italic", color: "var(--accent-deep)" }}>one seat</em> in your category.</h2>
          <p className="apply-sub">Apply for a 15-minute intro call. If we're a fit, you'll be invited to the Brand Voice Interview — the process from <em>Marketing Mayhem</em>.</p>

          <div className="apply-faq">
            {cfg.faq.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`apply-faq-item ${isOpen ? "open" : ""}`}>
                  <button className="apply-faq-q" onClick={() => setOpenFaq(isOpen ? -1 : i)} aria-expanded={isOpen}>
                    <span className="apply-faq-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="apply-faq-q-text">{f.q}</span>
                    <span className="apply-faq-chev">+</span>
                  </button>
                  <div className="apply-faq-a-wrap"><div className="apply-faq-a">{f.a}</div></div>
                </div>
              );
            })}
          </div>

          <a className="directory-link" href={base.brand.parentUrl} target="_blank" rel="noopener">
            <b>Not ready?</b> Browse the live directory <span className="arr">→</span>
          </a>

          {showFounder && <FounderBlock founder={base.founder} />}
        </div>

        <div className="form-card">
          <div className="form-head">
            <div className="form-step">Step {submitted ? 2 : step} / 2</div>
            <div className="form-progress"><div className="form-progress-fill" style={{ width: submitted ? "100%" : step === 1 ? "50%" : "100%" }} /></div>
          </div>
          {submitted ? (
            <div className="form-thanks">
              <div className="form-thanks-mark">
                <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M10 16.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="serif">Application received.</h3>
              <p>We'll review and reach out within two business days to schedule your 15-minute intro call.</p>
              <div className="form-thanks-meta">REF · APP-{Math.floor(Math.random() * 9000 + 1000)}</div>
              <a className="form-thanks-link" href={base.brand.parentUrl} target="_blank" rel="noopener">While you wait, browse the directory →</a>
            </div>
          ) : step === 1 ? (
            <form onSubmit={next} className="form-body">
              <div className="form-row">
                <label>Full name<input required value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Jane Reeves" /></label>
                <label>Email<input required type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@firm.com" /></label>
              </div>
              <div className="form-row">
                <label>Phone<input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 555-5555" /></label>
                <label>Profession<input required value={data.profession} onChange={(e) => update("profession", e.target.value)} /></label>
              </div>
              <label>City / metro served<input required value={data.city} onChange={(e) => update("city", e.target.value)} placeholder="Charlotte, NC" /></label>
              <button type="submit" className="btn btn-primary btn-lg form-submit">Continue<span className="arr">→</span></button>
              <div className="form-foot">5 fields now · 4 more on the next step</div>
            </form>
          ) : (
            <form onSubmit={submit} className="form-body">
              <div className="form-row">
                <label>Years in practice<input value={data.years} onChange={(e) => update("years", e.target.value)} placeholder="12" /></label>
                <label>Website / LinkedIn<input value={data.website} onChange={(e) => update("website", e.target.value)} placeholder="firm.com" /></label>
              </div>
              <label>Current monthly marketing spend
                <select value={data.spend} onChange={(e) => update("spend", e.target.value)}>
                  <option value="">Select a range…</option>
                  <option>$0 – $1,000</option><option>$1,000 – $5,000</option><option>$5,000 – $15,000</option>
                  <option>$15,000 – $50,000</option><option>$50,000+</option>
                </select>
              </label>
              <label>Why you'd be a fit<textarea rows={3} value={data.fit} onChange={(e) => update("fit", e.target.value)} placeholder="Briefly: who you serve, what's working, what's not." /></label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-primary btn-lg form-submit">Submit application<span className="arr">→</span></button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER (lean) ── */
function Footer({ base }) {
  return (
    <footer className="footer">
      <div className="foot-inner">
        <span>© {new Date().getFullYear()} Find a Business Pro</span>
        <a href={base.brand.parentUrl} target="_blank" rel="noopener">findabusinesspro.com →</a>
        <span>invitation.findabusinesspro.com</span>
        <a className="foot-admin" href="FABP Admin Preview.html">Admin preview →</a>
      </div>
    </footer>
  );
}

Object.assign(window, { TopNav, Hero, ProblemPromise, Plan, Apply, Footer, StatsBand, SampleProfile, Testimonials, FounderBlock });
