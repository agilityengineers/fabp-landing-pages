import { Reveal } from "./Reveal";
import { HeroCTAs } from "./HeroCTAs";
import type { Industry, Base } from "@/config/schema";

interface HeroProps {
  cfg: Industry;
  base: Base;
}

export function Hero({ cfg, base }: HeroProps) {
  const sp = cfg.profile;
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-grid">
        <div>
          <Reveal>
            <span className="eyebrow">
              <span className="dot" />
              {cfg.hero.eyebrow}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1
              className="hero-headline serif"
              dangerouslySetInnerHTML={{ __html: cfg.hero.headline }}
            />
          </Reveal>
          <Reveal delay={150}>
            <p className="hero-sub">{cfg.hero.subhead}</p>
          </Reveal>
          <HeroCTAs cfg={cfg} base={base} />
          <Reveal delay={300} className="hero-meta">
            <span className="meta-item">
              <span className="meta-dot green" />
              Category-exclusive per metro
            </span>
            <span className="meta-item">
              <span className="meta-dot" />
              Founder-led onboarding
            </span>
            <span className="meta-item">
              <span className="meta-dot green" />
              No per-lead fees
            </span>
          </Reveal>
        </div>

        <Reveal delay={120} className="hero-stage">
          <div className="hero-photo">
            {cfg.hero.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cfg.hero.heroImage} alt="" loading="eager" />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--ink-800)" }} />
            )}
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
                <div key={i}>
                  <div className="hcf-stat-v serif">{s.v}</div>
                  <div className="hcf-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
