import { NextRequest, NextResponse } from "next/server";
import { submitApplication } from "@/lib/forms";
import type { ApplicationData } from "@/lib/forms";

export async function POST(req: NextRequest) {
  const body = await req.json() as ApplicationData;

  if (
    !body.name ||
    !body.lastName ||
    !body.company ||
    !body.state ||
    !body.email ||
    !body.profession ||
    !body.city
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await submitApplication({
      ...body,
      submittedAt: body.submittedAt ?? new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[applications]", err);
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
