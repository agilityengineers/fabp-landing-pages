import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadIndustry, loadBase, listSlugs } from "@/lib/config";
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
  params: Promise<{ industry: string }>;
}

export async function generateStaticParams() {
  const slugs = listSlugs();
  return slugs.map((slug) => ({ industry: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry: slug } = await params;
  try {
    const cfg = loadIndustry(slug);
    return {
      title: cfg.seo.title,
      description: cfg.seo.description,
      openGraph: cfg.seo.ogImage ? { images: [cfg.seo.ogImage] } : undefined,
    };
  } catch {
    return { title: "Find a Business Pro" };
  }
}

export default async function IndustryPage({ params }: Props) {
  const { industry: slug } = await params;

  let cfg;
  let base;
  try {
    cfg = loadIndustry(slug);
    base = loadBase();
  } catch {
    notFound();
  }

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
