import { NextRequest, NextResponse } from "next/server";
import { loadIndustry, saveIndustry } from "@/lib/config";
import { uploadPlaybook, buildPlaybookKey } from "@/lib/s3";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

async function requireAuth(): Promise<boolean> {
  return isAuthenticated();
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

function buildKey(slug: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  return buildPlaybookKey(`playbooks/${slug}-${stamp}.pdf`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  let industry;
  try {
    industry = loadIndustry(slug);
  } catch {
    return NextResponse.json({ error: "Industry not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid form upload", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF uploads are supported" },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_BYTES / 1024 / 1024} MB limit` },
      { status: 413 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = sanitizeFilename(file.name || `${slug}-playbook.pdf`);
  const key = buildKey(slug);

  try {
    await uploadPlaybook(key, buffer, "application/pdf");
  } catch (err) {
    console.error("[playbook-upload] S3 upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  const updatedAt = new Date().toISOString();
  const updated = {
    ...industry,
    playbook: {
      s3Key: key,
      fileName,
      updatedAt,
      source: "uploaded" as const,
    },
  };
  saveIndustry(slug, updated);

  return NextResponse.json({
    ok: true,
    playbook: updated.playbook,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  let industry;
  try {
    industry = loadIndustry(slug);
  } catch {
    return NextResponse.json({ error: "Industry not found" }, { status: 404 });
  }

  if (!industry.playbook) {
    return NextResponse.json({ ok: true, playbook: null });
  }

  const cleared = { ...industry };
  delete cleared.playbook;
  saveIndustry(slug, cleared);

  return NextResponse.json({ ok: true, playbook: null });
}
