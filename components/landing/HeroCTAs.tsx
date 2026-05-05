"use client";
import type { Industry, Base } from "@/config/schema";

interface HeroCTAsProps {
  cfg: Industry;
  base: Base;
}

export function HeroCTAs({ cfg, base }: HeroCTAsProps) {
  function scrollToApply() {
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (cfg.sections.featuredOffer && cfg.featuredOffer) {
    const basicUrl = cfg.featuredOffer.basicSignupUrl ?? base.links.bdBasicSignupUrl;
    return (
      <div className="hero-ctas" style={{ marginTop: "32px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <a
          className="btn btn-primary btn-lg"
          href={basicUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {cfg.featuredOffer.primaryCta}
          <span className="arr">→</span>
        </a>
        <button className="btn btn-ghost btn-lg" onClick={scrollToApply}>
          {cfg.featuredOffer.secondaryCta}
          <span className="arr">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="hero-ctas" style={{ marginTop: "32px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
      <button className="btn btn-primary btn-lg" onClick={scrollToApply}>
        {cfg.hero.primaryCta}
        <span className="arr">→</span>
      </button>
      <a href="/provider-playbook.pdf" className="btn btn-ghost btn-lg" target="_blank" rel="noopener noreferrer">
        ↓ {cfg.hero.secondaryCta}
      </a>
    </div>
  );
}
