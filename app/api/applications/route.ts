import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitApplication } from "@/lib/forms";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { listSlugs } from "@/lib/config";

const MAX_BODY_BYTES = 32 * 1024; // 32 KB — way more than any plausible form post

const applicationSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    company: z.string().trim().min(1).max(200),
    state: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(50).optional(),
    profession: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(120),
    years: z.string().trim().max(50).optional(),
    website: z.string().trim().max(500).optional(),
    spend: z.string().trim().max(100).optional(),
    fit: z.string().trim().max(2000).optional(),
    industrySlug: z.string().regex(/^[a-z0-9-]+$/).max(80),
    submittedAt: z.string().datetime().optional(),
    variant: z.enum(["control", "outcome", "explicit"]).optional(),
  })
  .strict();

function clientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const limit = rateLimit(req, "applications", 5, 60_000);
  if (!limit.ok) return rateLimitResponse(limit);

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!listSlugs().includes(parsed.data.industrySlug)) {
    return NextResponse.json(
      { error: "Unknown industry" },
      { status: 400 },
    );
  }

  try {
    await submitApplication({
      ...parsed.data,
      submittedAt: parsed.data.submittedAt ?? new Date().toISOString(),
      userAgent: req.headers.get("user-agent") ?? undefined,
      ipAddress: clientIp(req),
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
