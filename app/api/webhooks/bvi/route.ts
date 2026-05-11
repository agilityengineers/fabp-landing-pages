/**
 * Inbound webhook receiver for BVI status updates.
 *
 * BVI's current `intake-submit` endpoint does not push back to us. This route
 * is scaffolded for the future case where BVI starts emitting status events
 * (e.g. "interview_scheduled", "listing_published"). When that lands, BVI
 * should sign requests with HMAC-SHA256 over the raw body using a shared
 * secret in BVI_WEBHOOK_SECRET, sent as `x-bvi-signature: sha256=<hex>`.
 *
 * Expected payload:
 *   {
 *     "lead_type": "invitation",          // or "playbook"
 *     "idempotency_key": "fabp-invitation-42",
 *     "external_id": "<bvi-interviewee-id>",
 *     "event": "interview_scheduled" | "listing_published" | ...,
 *     "occurred_at": "<iso>",
 *     "metadata": { ... }
 *   }
 *
 * If the BVI contract differs once it's documented, change verifySignature()
 * and the body parser only.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";
import {
  recordEvent,
  updateInvitationLead,
  updatePlaybookLead,
  type InvitationLead,
  type LeadType,
  type PlaybookLead,
} from "@/lib/leads";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.BVI_WEBHOOK_SECRET;
  if (!secret) {
    // Without a secret configured, refuse. Operators must set BVI_WEBHOOK_SECRET.
    return false;
  }
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const provided = signature.replace(/^sha256=/, "");
  if (provided.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex"),
    );
  } catch {
    return false;
  }
}

interface BviWebhookPayload {
  lead_type?: LeadType;
  idempotency_key?: string;
  external_id?: string;
  event?: string;
  occurred_at?: string;
  metadata?: Record<string, unknown>;
}

async function findLeadIdByIdempotencyKey(
  type: LeadType,
  key: string,
): Promise<number | null> {
  const table = type === "playbook" ? "playbook_leads" : "invitation_leads";
  const result = await query(
    `SELECT id FROM ${table} WHERE bvi_idempotency_key = $1 LIMIT 1`,
    [key],
  );
  return (result.rows[0]?.id as number) ?? null;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-bvi-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: BviWebhookPayload;
  try {
    payload = JSON.parse(raw) as BviWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lead_type, idempotency_key, external_id, event } = payload;
  if (!lead_type || (lead_type !== "playbook" && lead_type !== "invitation")) {
    return NextResponse.json({ error: "Missing/invalid lead_type" }, { status: 400 });
  }
  if (!idempotency_key) {
    return NextResponse.json({ error: "Missing idempotency_key" }, { status: 400 });
  }
  if (!event) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  const leadId = await findLeadIdByIdempotencyKey(lead_type, idempotency_key);
  if (!leadId) {
    return NextResponse.json(
      { error: "No lead matches that idempotency_key" },
      { status: 404 },
    );
  }

  const patch: Record<string, unknown> = {};
  if (external_id) patch.bvi_external_id = external_id;

  // Map a small set of known events to invitation-lead pipeline state.
  if (lead_type === "invitation") {
    if (event === "interview_scheduled") {
      patch.invitation_step = "brand_voice_interview";
      patch.status = "interview_scheduled";
      if (payload.occurred_at) patch.interview_scheduled_at = payload.occurred_at;
    } else if (event === "listing_published") {
      patch.invitation_step = "listed";
      patch.status = "listed";
      if (payload.occurred_at) patch.listing_published_at = payload.occurred_at;
    }
  }

  if (Object.keys(patch).length > 0) {
    if (lead_type === "playbook") {
      await updatePlaybookLead(leadId, patch as Partial<PlaybookLead>);
    } else {
      await updateInvitationLead(leadId, patch as Partial<InvitationLead>);
    }
  }

  await recordEvent(
    lead_type,
    leadId,
    `bvi_webhook:${event}`,
    payload as unknown as Record<string, unknown>,
    "bvi",
  );

  return NextResponse.json({ ok: true });
}
