"use client";
import type { Industry } from "@/config/schema";

export function HeroCTAs({ cfg }: { cfg: Industry }) {
  function scrollToApply() {
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
