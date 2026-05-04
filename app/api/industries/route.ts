import { NextRequest, NextResponse } from "next/server";
import { loadIndustry, listIndustries, saveIndustry, deleteIndustry, HOME_SLUG } from "@/lib/config";
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

    if (slug === HOME_SLUG && (action === "unpublish" || action === "delete")) {
      return NextResponse.json(
        { error: "The home page config cannot be unpublished or deleted." },
        { status: 400 }
      );
    }

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

export async function DELETE(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  if (slug === HOME_SLUG) {
    return NextResponse.json(
      { error: "The home page config cannot be deleted." },
      { status: 400 }
    );
  }

  deleteIndustry(slug);
  return NextResponse.json({ ok: true });
}
