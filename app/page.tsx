import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadIndustry, loadBase, HOME_SLUG } from "@/lib/config";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ProblemPromise } from "@/components/landing/ProblemPromise";
import { Plan } from "@/components/landing/Plan";
import { StatsBand } from "@/components/landing/StatsBand";
import { SampleProfile } from "@/components/landing/SampleProfile";
import { Testimonials } from "@/components/landing/Testimonials";
import { Apply } from "@/components/landing/Apply";
import { Footer } from "@/components/landing/Footer";

function tryLoadHome() {
  try {
    return { cfg: loadIndustry(HOME_SLUG), base: loadBase() };
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = tryLoadHome();
  if (!data) return { title: "Find a Business Pro" };
  const { cfg } = data;
  return {
    title: cfg.seo.title,
    description: cfg.seo.description,
    openGraph: cfg.seo.ogImage ? { images: [cfg.seo.ogImage] } : undefined,
  };
}

export default async function Home() {
  const data = tryLoadHome();
  if (!data) notFound();
  const { cfg, base } = data;
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: base.brand.name,
            url: base.brand.parentUrl,
            telephone: base.brand.phone,
            description: cfg.seo.description,
          }),
        }}
      />
    </>
  );
}
