/**
 * Higher-level BVI sync orchestrator: takes a lead row, pushes it via
 * lib/bvi-client, persists the outcome to playbook_leads/invitation_leads,
 * appends a bvi_sync_log entry, and emits a lead_events activity entry.
 *
 * Used by:
 *   - inline pushes from /api/playbook-leads and /api/applications
 *   - manual retries from /api/admin/leads/:type/:id/sync-bvi
 *   - the /api/cron/sync-bvi background catch-up job
 */

import {
  claimLeadForBviSync,
  getInvitationLead,
  getPlaybookLead,
  recordBviAttempt,
  recordEvent,
  updateInvitationLead,
  updatePlaybookLead,
  listLeadsNeedingBviSync,
  type InvitationLead,
  type LeadType,
  type PlaybookLead,
} from "@/lib/leads";
import { idempotencyKey, pushLeadToBvi, type BviPushResult } from "@/lib/bvi-client";

export interface SyncOutcome {
  ok: boolean;
  attempts: number;
  status: "synced" | "failed" | "skipped";
  error?: string;
  externalId?: string;
}

export async function syncLeadToBvi(
  type: LeadType,
  id: number,
  actor: string | null = "system",
): Promise<SyncOutcome> {
  const claimed = await claimLeadForBviSync(type, id);
  if (!claimed) {
    return {
      ok: false,
      attempts: 0,
      status: "skipped",
      error: "Lead not eligible for sync (already in_flight, synced, or deleted)",
    };
  }

  let result: BviPushResult;
  try {
    result = await pushLeadToBvi(type, claimed, {
      onAttempt: async (attempt, attemptResult) => {
        await recordBviAttempt(type, id, attempt, undefined, {
          responseStatus: attemptResult.responseStatus,
          responseBody: attemptResult.responseBody?.slice(0, 4000),
          error: attemptResult.error,
        });
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await persistFailure(type, id, message, claimed.bvi_attempts ?? 0);
    await recordEvent(type, id, "bvi_failed", { error: message }, actor);
    return { ok: false, attempts: 0, status: "failed", error: message };
  }

  if (result.ok) {
    const idemKey = idempotencyKey(type, id);
    const patch = {
      bvi_sync_status: "synced" as const,
      bvi_synced_at: new Date().toISOString(),
      bvi_external_id: result.externalId ?? null,
      bvi_idempotency_key: idemKey,
      bvi_last_error: null,
    };
    if (type === "playbook") {
      await updatePlaybookLead(id, patch as Partial<PlaybookLead>);
    } else {
      await updateInvitationLead(id, patch as Partial<InvitationLead>);
    }
    await recordEvent(
      type,
      id,
      "bvi_synced",
      { external_id: result.externalId ?? null, attempts: result.attempts },
      actor,
    );
    return {
      ok: true,
      attempts: result.attempts,
      status: "synced",
      externalId: result.externalId,
    };
  }

  const errorDetail =
    result.error ??
    `HTTP ${result.responseStatus}: ${result.responseBody?.slice(0, 500) ?? ""}`;
  await persistFailure(type, id, errorDetail, claimed.bvi_attempts ?? 0);
  await recordEvent(
    type,
    id,
    "bvi_failed",
    { attempts: result.attempts, status: result.responseStatus, error: errorDetail },
    actor,
  );
  return {
    ok: false,
    attempts: result.attempts,
    status: "failed",
    error: errorDetail,
  };
}

async function persistFailure(
  type: LeadType,
  id: number,
  message: string,
  _claimedAttemptCount: number,
): Promise<void> {
  const patch = {
    bvi_sync_status: "failed" as const,
    bvi_last_error: message.slice(0, 4000),
  };
  if (type === "playbook") {
    await updatePlaybookLead(id, patch as Partial<PlaybookLead>);
  } else {
    await updateInvitationLead(id, patch as Partial<InvitationLead>);
  }
}

/**
 * Convenience helper for the form-submit hot path: best-effort fire-and-forget
 * push that never throws. Mirrors the existing Slack pattern in
 * /api/playbook-leads — the caller continues regardless of BVI outcome.
 */
export async function safeSyncLeadToBvi(
  type: LeadType,
  id: number,
  actor: string | null = "system",
): Promise<void> {
  try {
    await syncLeadToBvi(type, id, actor);
  } catch (err) {
    console.error(`[bvi-sync] unexpected failure (${type} ${id}):`, err);
  }
}

export async function runBviSyncBatch(
  limit = 25,
): Promise<{ attempted: number; succeeded: number; failed: number; skipped: number }> {
  const summary = { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
  for (const type of ["playbook", "invitation"] as const) {
    const ids = await listLeadsNeedingBviSync(type, limit);
    for (const { id } of ids) {
      summary.attempted++;
      const out = await syncLeadToBvi(type, id, "cron");
      if (out.status === "synced") summary.succeeded++;
      else if (out.status === "skipped") summary.skipped++;
      else summary.failed++;
    }
  }
  return summary;
}

export async function getLeadForBviPreview(
  type: LeadType,
  id: number,
): Promise<PlaybookLead | InvitationLead | null> {
  return type === "playbook" ? getPlaybookLead(id) : getInvitationLead(id);
}
