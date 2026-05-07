import { NextRequest, NextResponse } from "next/server";
import { listSlugs } from "@/lib/config";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const exists = listSlugs().includes(slug);
  return NextResponse.json({ slug, exists });
}
