"use client";
import type { Industry, Base } from "@/config/schema";
import { PlaybookButton } from "./PlaybookButton";

interface HeroCTAsProps {
  cfg: Industry;
  base: Base;
}

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

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
      <PlaybookButton
        industrySlug={cfg.slug}
        label={cfg.hero.secondaryCta}
        turnstileSiteKey={TURNSTILE_SITE_KEY}
      />
    </div>
  );
}
