import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadPlaybook, getDefaultPlaybookKey } from "@/lib/s3";

const MAX_BYTES = 25 * 1024 * 1024;

async function requireAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "1";
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Only PDF uploads are supported" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = getDefaultPlaybookKey();

  try {
    await uploadPlaybook(key, buffer, "application/pdf");
  } catch (err) {
    console.error("[playbook-default] S3 upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    s3Key: key,
    updatedAt: new Date().toISOString(),
  });
}
