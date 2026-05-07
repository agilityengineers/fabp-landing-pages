import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { loadIndustry } from "@/lib/config";
import { postSlackBlockKit } from "@/lib/slack";
import {
  DEFAULT_PLAYBOOK_KEY,
  getPresignedDownloadUrl,
} from "@/lib/s3";
import { verifyTurnstile } from "@/lib/turnstile";

const leadSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(50),
  consent: z.literal(true),
  industrySlug: z.string().regex(/^[a-z0-9-]+$/),
  turnstileToken: z.string().optional(),
});

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
    key: DEFAULT_PLAYBOOK_KEY,
    fileName: "FABP-Provider-Playbook.pdf",
  };
}

function clientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function POST(req: NextRequest) {
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

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const turnstile = await verifyTurnstile(parsed.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Bot check failed", detail: turnstile.reason },
      { status: 403 },
    );
  }

  const { key, fileName } = resolvePlaybookKey(parsed.industrySlug);

  let presignedUrl: string;
  try {
    presignedUrl = await getPresignedDownloadUrl(key, fileName, 300);
  } catch (err) {
    console.error("[playbook-leads] presigned URL generation failed:", err);
    return NextResponse.json(
      { error: "Playbook delivery is temporarily unavailable" },
      { status: 503 },
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
  }

  return NextResponse.json({ ok: true, downloadUrl: presignedUrl });
}
