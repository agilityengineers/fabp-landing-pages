"use client";
import { useEffect, useState } from "react";
import type { Industry, Base } from "@/config/schema";
import { industrySchema } from "@/config/schema";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ProblemPromise } from "@/components/landing/ProblemPromise";
import { Plan } from "@/components/landing/Plan";
import { StatsBand } from "@/components/landing/StatsBand";
import { SampleProfile } from "@/components/landing/SampleProfile";
import { Testimonials } from "@/components/landing/Testimonials";
import { Apply } from "@/components/landing/Apply";
import { Footer } from "@/components/landing/Footer";

interface Props {
  initialCfg: Industry;
  base: Base;
}

export function LivePreview({ initialCfg, base }: Props) {
  const [cfg, setCfg] = useState<Industry>(initialCfg);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== window.parent) return;
      const data = e.data;
      if (!data || data.type !== "fabp:preview") return;
      const parsed = industrySchema.safeParse(data.cfg);
      if (parsed.success) {
        setCfg(parsed.data);
      }
    }
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "fabp:preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const { sections } = cfg;

  return (
    <>
      <Nav cfg={cfg} base={base} />
      <main>
        {sections.hero && <Hero cfg={cfg} />}
        {sections.problemPromise && <ProblemPromise cfg={cfg} />}
        {sections.plan && <Plan cfg={cfg} />}
        {sections.statsBand && <StatsBand cfg={cfg} />}
        {sections.sampleProfile && <SampleProfile cfg={cfg} />}
        {sections.testimonials && <Testimonials cfg={cfg} />}
        {sections.apply && (
          <Apply cfg={cfg} base={base} showFounder={cfg.showFounder && sections.founder} />
        )}
      </main>
      <Footer base={base} />
    </>
  );
}
