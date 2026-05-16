import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { loadIndustry, listSlugs } from "@/lib/config";
import { postSlackBlockKit } from "@/lib/slack";
import {
  getDefaultPlaybookKey,
  getPresignedDownloadUrl,
  objectExists,
} from "@/lib/s3";
import { verifyTurnstile } from "@/lib/turnstile";
import { recordEvent } from "@/lib/leads";
import { safeSyncLeadToBvi } from "@/lib/bvi-sync";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 32 * 1024;

const leadSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(7).max(50),
    consent: z.literal(true),
    industrySlug: z.string().regex(/^[a-z0-9-]+$/).max(80),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

type LeadInput = z.infer<typeof leadSchema>;

function resolvePlaybookKey(industrySlug: string): {
  key: string;
  fileName: string;
} {
  try {
    const industry = loadIndustry(industrySlug);
    if (industry.playbook?.s3Key) {
      return {
        key: industry.playbook.s3Key,
        fileName: industry.playbook.fileName,
      };
    }
  } catch {
    // Fall through to default
  }
  return {
    key: getDefaultPlaybookKey(),
    fileName: "FABP-Provider-Playbook.pdf",
  };
}

function clientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const limit = rateLimit(req, "playbook-leads", 5, 60_000);
  if (!limit.ok) return rateLimitResponse(limit);

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let parsed: LeadInput;
  try {
    const body = await req.json();
    parsed = leadSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid submission",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  if (!listSlugs().includes(parsed.industrySlug)) {
    return NextResponse.json({ error: "Unknown industry" }, { status: 400 });
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const turnstile = await verifyTurnstile(parsed.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Bot check failed", detail: turnstile.reason },
      { status: 403 },
    );
  }

  let leadId: number | null = null;
  try {
    const insert = await query(
      `INSERT INTO playbook_leads
        (first_name, last_name, email, phone, consent,
         industry_slug, user_agent, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        parsed.firstName,
        parsed.lastName,
        parsed.email,
        parsed.phone,
        parsed.consent,
        parsed.industrySlug,
        userAgent ?? null,
        ip ?? null,
      ],
    );
    leadId = insert.rows[0]?.id ?? null;
  } catch (err) {
    console.error("[playbook-leads] DB insert failed:", err);
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 },
    );
  }

  const { key, fileName } = resolvePlaybookKey(parsed.industrySlug);

  const isAdmin = await isAuthenticated();
  const envContext = {
    awsRegion: process.env.AWS_REGION ? "set" : "unset",
    awsBucket: process.env.AWS_S3_BUCKET ? "set" : "unset",
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID ? "set" : "unset",
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY ? "set" : "unset",
  };

  let presignedUrl: string | null = null;
  let deliveryError: { error: string; detail?: string } | null = null;

  try {
    const exists = await objectExists(key);
    if (!exists) {
      console.error(
        "[playbook-leads] playbook object missing",
        { key, ...envContext },
      );
      deliveryError = {
        error:
          "The playbook hasn't been uploaded yet. Please try again shortly.",
        ...(isAdmin ? { detail: `S3 object not found at key "${key}"` } : {}),
      };
    } else {
      try {
        presignedUrl = await getPresignedDownloadUrl(key, fileName);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.error(
          "[playbook-leads] presigned URL generation failed",
          { key, ...envContext, error: detail },
        );
        deliveryError = {
          error: "Playbook delivery is temporarily unavailable",
          ...(isAdmin ? { detail } : {}),
        };
      }
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(
      "[playbook-leads] S3 HEAD check failed",
      { key, ...envContext, error: detail },
    );
    deliveryError = {
      error: "Playbook delivery is temporarily unavailable",
      ...(isAdmin ? { detail } : {}),
    };
  }

  const fullName = `${parsed.firstName} ${parsed.lastName}`.trim();
  const slackResult = await postSlackBlockKit(
    process.env.PLAYBOOK_SLACK_WEBHOOK_URL,
    {
      text: `📘 *New Provider Playbook lead*\n• ${fullName}\n• ${parsed.email}\n• ${parsed.phone}\n• Industry: ${parsed.industrySlug}`,
      attachments: [
        {
          color: "good",
          fields: [
            { title: "Name", value: fullName, short: true },
            { title: "Email", value: parsed.email, short: true },
            { title: "Phone", value: parsed.phone, short: true },
            { title: "Industry", value: parsed.industrySlug, short: true },
            {
              title: "Submitted (UTC)",
              value: new Date().toISOString(),
              short: false,
            },
          ],
        },
      ],
    },
    "playbook-leads",
  );

  if (leadId !== null) {
    try {
      await query(
        `UPDATE playbook_leads SET slack_status = $1 WHERE id = $2`,
        [slackResult, leadId],
      );
    } catch (err) {
      console.error("[playbook-leads] failed to update slack_status:", err);
    }

    try {
      await recordEvent("playbook", leadId, "created", {
        industry_slug: parsed.industrySlug,
        slack_status: slackResult,
      }, "system");
    } catch (err) {
      console.error("[playbook-leads] failed to record creation event:", err);
    }

    // Best-effort BVI push: if it fails, the row is left bvi_sync_status='failed'
    // and the cron retry job (or admin manual retry) will pick it up.
    void safeSyncLeadToBvi("playbook", leadId, "system");
  }

  if (!presignedUrl) {
    return NextResponse.json(deliveryError, { status: 503 });
  }

  return NextResponse.json({ ok: true, downloadUrl: presignedUrl });
}
