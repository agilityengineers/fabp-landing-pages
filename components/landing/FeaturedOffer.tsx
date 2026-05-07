"use client";
import { Reveal } from "./Reveal";
import type { Industry, Base } from "@/config/schema";

interface FeaturedOfferProps {
  cfg: Industry;
  base: Base;
}

export function FeaturedOffer({ cfg, base }: FeaturedOfferProps) {
  if (!cfg.sections.featuredOffer || !cfg.featuredOffer) return null;

  const offer = cfg.featuredOffer;
  const basicUrl = offer.basicSignupUrl ?? base.links.bdBasicSignupUrl;

  function scrollToApply() {
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="featured-offer" id="featured-offer">
      <div className="container">
        <Reveal>
          <span className="eyebrow">
            <span className="dot" />
            {offer.eyebrow}
          </span>
        </Reveal>
        <Reveal delay={80}>
          <h2
            className="serif"
            dangerouslySetInnerHTML={{ __html: offer.headline }}
          />
        </Reveal>
        <Reveal delay={140}>
          <p className="lead">{offer.body}</p>
        </Reveal>
        <Reveal delay={200}>
          <div
            className="featured-offer-ctas"
            style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}
          >
            <a
              className="btn btn-primary btn-lg"
              href={basicUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {offer.primaryCta}
              <span className="arr">→</span>
            </a>
            <button className="btn btn-ghost btn-lg" onClick={scrollToApply}>
              {offer.secondaryCta}
              <span className="arr">→</span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
