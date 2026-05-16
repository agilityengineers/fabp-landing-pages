import { NextRequest, NextResponse } from "next/server";
import { regenerateSection } from "@/lib/claude";
import { loadIndustry, saveIndustry } from "@/lib/config";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, section } = await req.json();
  if (!slug || !section) {
    return NextResponse.json({ error: "slug and section are required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const industry = loadIndustry(slug);
    const updated = await regenerateSection(industry, section);
    const merged = { ...industry, [section]: updated[section as keyof typeof updated] ?? updated };
    saveIndustry(slug, merged);
    return NextResponse.json(merged);
  } catch (err) {
    console.error("[regenerate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
