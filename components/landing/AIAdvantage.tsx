"use client";

import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";
import type { Industry } from "@/config/schema";

type Variant = "control" | "outcome" | "explicit";

const COOKIE_NAME = "fabp_ai_variant";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

function readVariantCookie(): Variant | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)fabp_ai_variant=([^;]+)/);
  const v = match?.[1];
  if (v === "control" || v === "outcome" || v === "explicit") return v;
  return null;
}

function assignVariant(): Variant {
  const r = Math.random();
  if (r < 1 / 3) return "control";
  if (r < 2 / 3) return "outcome";
  return "explicit";
}

function writeVariantCookie(v: Variant) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${v}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

export function AIAdvantage({ cfg }: { cfg: Industry }) {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    let v = readVariantCookie();
    if (!v) {
      v = assignVariant();
      writeVariantCookie(v);
    }
    setVariant(v);
  }, []);

  if (variant === null || variant === "control") return null;

  const industryShort = cfg.industryShort;
  const isExplicit = variant === "explicit";

  const headline = isExplicit
    ? "AI-powered leverage, built around your expertise"
    : "An advantage your competition can’t replicate";

  const subhead = isExplicit
    ? "Your $5M–$250M clients expect a serious advisor. We build the AI and software infrastructure that proves you are one — with your judgment at the center, never replaced by it."
    : "Your $5M–$250M clients expect a serious advisor. We build the infrastructure that proves you are one — custom software, sharpened messaging, and the kind of visibility no solo practice could maintain alone.";

  const blocks = [
    {
      title: isExplicit
        ? "Custom AI tools, built for one practice: yours."
        : "Tools built for one practice: yours.",
      body: `Custom software, prototypes, and proofs of concept that no individual ${industryShort} could justify alone — designed, built, and maintained on your behalf.`,
    },
    {
      title: isExplicit
        ? "An AI-driven marketing engine that runs while you work."
        : "A marketing engine that runs while you work.",
      body: "On-voice content, sharpened messaging, and consistent visibility — produced at a cadence no solo practitioner can sustain. Your authority compounds without your evenings.",
    },
    {
      title: isExplicit
        ? "Discoverable where your clients are already searching."
        : "Found in the search layer your clients are already using.",
      body: `When a prospective client asks ChatGPT, Perplexity, or Google’s AI Overviews for the best ${industryShort} in their market, your name is the answer.`,
    },
    {
      title: isExplicit
        ? "AI augments your judgment. It does not replace it."
        : "Your judgment stays the center of the practice.",
      body: "Reach, cadence, and leverage are ours to handle. The work that has your name on it is still yours.",
    },
  ];

  const closing = isExplicit
    ? "This is how serious firms scale with technology — not at the expense of what makes them serious."
    : "This is how serious firms scale without losing what makes them serious.";

  return (
    <section className="ai-advantage" id="ai-advantage" data-variant={variant}>
      <div className="container">
        <div className="aia-head">
          <span className="eyebrow">
            <span className="dot" />
            What you get when you join
          </span>
          <h2 className="serif aia-headline">{headline}</h2>
          <p className="lead aia-subhead">{subhead}</p>
        </div>
        <div className="aia-grid">
          {blocks.map((b, i) => (
            <Reveal key={i} delay={i * 80} className="aia-block">
              <div className="aia-num serif">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="aia-title">{b.title}</h3>
              <p className="aia-body">{b.body}</p>
            </Reveal>
          ))}
        </div>
        <p className="aia-closing serif">{closing}</p>
      </div>
    </section>
  );
}
