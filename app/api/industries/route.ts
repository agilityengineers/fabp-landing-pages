import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { loadIndustry, listIndustries, saveIndustry, deleteIndustry } from "@/lib/config";
import { industrySchema } from "@/config/schema";
import { cookies } from "next/headers";

async function requireAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "1";
}

export async function GET() {
  const industries = listIndustries();
  return NextResponse.json(industries);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  try {
    const validated = industrySchema.parse(body);
    saveIndustry(validated.slug, validated);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { slug, action } = body;

  if (!slug || !action) {
    return NextResponse.json({ error: "slug and action are required" }, { status: 400 });
  }

  try {
    const industry = loadIndustry(slug);

    if (action === "publish") {
      saveIndustry(slug, { ...industry, published: true });
    } else if (action === "unpublish") {
      saveIndustry(slug, { ...industry, published: false });
    } else if (action === "delete") {
      deleteIndustry(slug);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { slug, industry, industryShort, industryPlural, professionId } = body;

  if (!slug || !industry || !industryShort || !professionId) {
    return NextResponse.json(
      { error: "slug, industry, industryShort, and professionId are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug may only contain lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  const existingFile = path.join(process.cwd(), "config", "industries", `${slug}.json`);
  if (fs.existsSync(existingFile)) {
    return NextResponse.json(
      { error: `An industry with slug "${slug}" already exists` },
      { status: 409 }
    );
  }

  const defaults = {
    slug,
    professionId: Number(professionId),
    industry,
    industryShort,
    ...(industryPlural ? { industryPlural } : {}),
    published: false,
    seo: {
      title: `An Invitation for ${industry} — Find a Business Pro`,
      description: "",
    },
    hero: {
      eyebrow: `An Invitation — for ${industry}`,
      headline: "Your headline here — use <em>emphasis</em> for effect.",
      subhead: `A category-exclusive listing in the directory business owners search when they need a ${industryShort.toLowerCase()}.`,
      primaryCta: "Book a 15-min intro call",
      secondaryCta: "Provider Playbook",
      heroPhotoLabel: `${industryShort.toUpperCase()} · CITY, STATE`,
    },
    problem: {
      headline: `You didn't earn the credentials to become a marketer.`,
      villains: [
        { t: "Pain point one", b: "Describe the first key challenge facing this professional." },
        { t: "Pain point two", b: "Describe the second key challenge." },
        { t: "Pain point three", b: "Describe the third key challenge." },
        { t: "Pain point four", b: "Describe the fourth key challenge." },
      ],
    },
    promise: {
      headline: "From reactive to chosen — by the business owners who need you most.",
      stats: [
        { v: "$X", l: "Avg. annual engagement" },
        { v: "1", l: "Per category, per metro" },
        { v: "90 days", l: "To first inbound" },
      ],
    },
    plan: [
      { time: "Step 01", title: "Apply", body: "A 5-minute application. We screen for credentials, focus area, and market availability." },
      { time: "Step 02", title: "Brand voice interview", body: "A 45-minute senior client advisor-led conversation that shapes how your listing sounds." },
      { time: "Step 03", title: "Get listed & matched", body: "Your category-exclusive profile goes live. Buyer-intent inquiries route to you — not a queue." },
    ],
    profile: {
      name: "J. Sample",
      role: `${industryShort}`,
      city: "City, ST",
      stats: [
        { v: "10yr", l: "Experience" },
        { v: "50+", l: "Clients served" },
        { v: "$0M", l: "Volume" },
      ],
    },
    statsBand: [
      { v: "$X", l: "Avg. annual engagement" },
      { v: "X%", l: "Stat label" },
      { v: "1 / metro", l: "Per category, per metro" },
    ],
    faq: [
      { q: "What does it cost to be listed?", a: "Listing is free. After applying, we run a Brand Voice Interview to determine fit." },
      { q: "What does category exclusivity mean?", a: `One listed ${industryShort.toLowerCase()} per market.` },
      { q: "How is this different from other directories?", a: "We curate, vet, and position — we don't flatten every professional into a directory entry." },
      { q: "What happens after I apply?", a: "A 15-minute intro call, then a Brand Voice Interview. Listings typically go live within two weeks." },
    ],
    testimonials: [],
    sections: {
      hero: true,
      problemPromise: true,
      plan: true,
      sampleProfile: false,
      statsBand: false,
      testimonials: false,
      founder: false,
      apply: true,
    },
    showFounder: false,
    accent: "navy" as const,
  };

  try {
    const validated = industrySchema.parse(defaults);
    saveIndustry(slug, validated);
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  deleteIndustry(slug);
  return NextResponse.json({ ok: true });
}
