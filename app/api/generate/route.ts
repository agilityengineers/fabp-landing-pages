import { NextRequest, NextResponse } from "next/server";
import { generateIndustryConfig } from "@/lib/claude";
import { saveIndustry } from "@/lib/config";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  if (cookieStore.get("admin-auth")?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, notes = "" } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Industry name is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Set it in your environment variables." },
      { status: 500 }
    );
  }

  try {
    const config = await generateIndustryConfig(name.trim(), notes.trim());
    saveIndustry(config.slug, config);
    return NextResponse.json({ slug: config.slug, config });
  } catch (err) {
    console.error("[generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
