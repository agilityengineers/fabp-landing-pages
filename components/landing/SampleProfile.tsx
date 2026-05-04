import { Reveal } from "./Reveal";
import type { Industry } from "@/config/schema";

export function SampleProfile({ cfg }: { cfg: Industry }) {
  const sp = cfg.profile;
  const citySlug = sp.city.toLowerCase().split(",")[0].replace(/\s+/g, "-");
  const industrySlug = cfg.industry.toLowerCase().replace(/\s+/g, "-");

  return (
    <section className="sample-profile">
      <div className="container sample-grid">
        <Reveal>
          <span className="eyebrow">
            <span className="dot" />
            Sample listing
          </span>
          <h2 className="serif sample-h">This is what your listing looks like.</h2>
          <p className="sample-sub">
            Editorial-grade. SEO-indexed. Linked from the parent directory&rsquo;s high-traffic
            pages. Buyer-intent search routes inquiries to your inbox — not a queue.
          </p>
          <ul className="sample-bullets">
            {[
              "Custom written by our editorial team",
              "Schema-marked for buyer searches",
              "Linked from parent directory landing pages",
            ].map((b, i) => (
              <li key={i}>
                <span className="check">
                  <svg viewBox="0 0 16 16">
                    <path
                      d="M3 8.5l3.5 3.5 6.5-7.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} className="browser-mock">
          <div className="bm-chrome">
            <div className="bm-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="bm-url">
              findabusinesspro.com / {industrySlug} / {citySlug}
            </div>
          </div>
          <div className="bm-body">
            <div className="bm-hero">
              <div className="bm-avatar">{sp.name[0]}</div>
              <div className="bm-id">
                <div className="bm-name serif">{sp.name}</div>
                <div className="bm-role">
                  {sp.role} · {sp.city}
                </div>
              </div>
              <span className="hcf-badge">Listed</span>
            </div>
            <div className="bm-stats">
              {sp.stats.map((s, i) => (
                <div key={i}>
                  <div className="bm-stat-v serif">{s.v}</div>
                  <div className="bm-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="bm-section">
              <div className="bm-label">About</div>
              <div className="bm-line w90" />
              <div className="bm-line w95" />
              <div className="bm-line w70" />
            </div>
            <div className="bm-section" style={{ borderBottom: "none" }}>
              <div className="bm-label">Specialties</div>
              <div className="bm-tags">
                <span>Category A</span>
                <span>Category B</span>
                <span>Category C</span>
                <span>Category D</span>
              </div>
            </div>
            <button className="bm-cta">Request a consultation →</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
