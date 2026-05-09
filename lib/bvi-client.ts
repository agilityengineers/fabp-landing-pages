/**
 * Brand Voice Interview (BVI) Flow Tracker client.
 *
 * BVI exposes a single public, no-auth endpoint that creates/updates the
 * contact, the intake response, and the interviewee record (placed on the
 * first Kanban stage) in one call. We post FABP leads here so BVI sales reps
 * pick them up in the existing flow.
 *
 *   POST https://brand-voice-interview.com/api/public/intake-submit
 *
 * Required body fields:
 *   userData.email, userData.name (the only hard-required fields)
 *   intakeData.{elevatorPitch,knownFor,targetAudience,marketingFrustration,
 *               referralHope,brandTone,uniqueBelief,brandChannels,storyBackground}
 *     — all required as keys (empty strings / [] are accepted)
 *
 * BVI dedupes by email server-side (existing user is reused), so we get
 * idempotency for free. We additionally track our own bvi_idempotency_key per
 * lead row so we can tell whether we've already pushed this lead.
 *
 * The BVI endpoint has no native lead_type / industry field, so we encode the
 * source distinction inside intakeData.storyBackground (highly visible on
 * their Kanban) and intakeData.servicePreference. If BVI later adds a proper
 * lead_type field, or offers POST /api/public/lead, swap mapLeadToIntake().
 */

import type {
  LeadType,
  PlaybookLead,
  InvitationLead,
} from "@/lib/leads";

const DEFAULT_BVI_BASE_URL = "https://brand-voice-interview.com";
const DEFAULT_BVI_PATH = "/api/public/intake-submit";

const MAX_PUSH_ATTEMPTS = 4;
const RETRY_BACKOFF_MS = [500, 1500, 4000];

export interface BviIntakePayload {
  userData: {
    email: string;
    name: string;
    phone: string | null;
    companyName: string | null;
  };
  intakeData: {
    elevatorPitch: string;
    knownFor: string;
    targetAudience: string;
    marketingFrustration: string;
    referralHope: string;
    brandTone: string;
    uniqueBelief: string;
    brandChannels: string[];
    storyBackground: string;
    servicePreference: string;
    marketingBudget: string;
  };
  interviewerId: string | null;
  advisorId: string | null;
  landingPageId: number | null;
}

export interface BviPushResult {
  ok: boolean;
  responseStatus?: number;
  responseBody?: string;
  externalId?: string;
  attempts: number;
  error?: string;
  request: BviIntakePayload;
}

interface CommonLeadFields {
  type: LeadType;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  company: string | null;
  industrySlug: string;
}

function commonFields(
  type: LeadType,
  lead: PlaybookLead | InvitationLead,
): CommonLeadFields {
  const company =
    type === "invitation"
      ? (lead as InvitationLead).company ?? null
      : null;
  return {
    type,
    id: lead.id,
    email: lead.email,
    firstName: lead.first_name,
    lastName: lead.last_name,
    phone: lead.phone ?? null,
    company,
    industrySlug: lead.industry_slug,
  };
}

export function idempotencyKey(type: LeadType, id: number): string {
  return `fabp-${type}-${id}`;
}

/**
 * Maps an FABP lead to BVI's intake-submit payload. Encodes lead-type and
 * industry into the storyBackground / servicePreference fields so the BVI
 * sales rep sees them on their Kanban. Invitation leads also pass through
 * profession / spend / fit so the rep can size the conversation on first
 * contact.
 */
export function mapLeadToIntake(
  type: LeadType,
  lead: PlaybookLead | InvitationLead,
): BviIntakePayload {
  const c = commonFields(type, lead);
  const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  const idemKey = idempotencyKey(type, c.id);

  let storyBackground = "";
  let knownFor = "";
  let marketingFrustration = "";
  let marketingBudget = "";
  const brandChannels: string[] = ["FABP"];

  if (type === "invitation") {
    const inv = lead as InvitationLead;
    const parts = [
      `Source: FABP invitation lead from ${c.industrySlug} landing page.`,
      `Profession: ${inv.profession ?? "—"}.`,
      `Market: ${inv.city ?? "—"}, ${inv.state ?? "—"}.`,
      inv.years ? `Years in practice: ${inv.years}.` : null,
      inv.website ? `Website: ${inv.website}.` : null,
      inv.spend ? `Monthly marketing spend: ${inv.spend}.` : null,
      `FABP step: ${inv.invitation_step}.`,
      `Idempotency key: ${idemKey}.`,
    ].filter(Boolean);
    storyBackground = parts.join(" ");
    knownFor = `${inv.profession ?? c.industrySlug} — ${inv.city ?? ""} ${inv.state ?? ""}`.trim();
    marketingFrustration = inv.fit ?? "";
    marketingBudget = inv.spend ?? "";
  } else {
    storyBackground = [
      `Source: FABP playbook download from ${c.industrySlug} landing page.`,
      "Lead magnet: Provider Playbook PDF.",
      `Idempotency key: ${idemKey}.`,
    ].join(" ");
    knownFor = c.industrySlug;
  }

  return {
    userData: {
      email: c.email,
      name: fullName || c.email,
      phone: c.phone,
      companyName: c.company,
    },
    intakeData: {
      elevatorPitch: "",
      knownFor,
      targetAudience: "",
      marketingFrustration,
      referralHope: "",
      brandTone: "",
      uniqueBelief: "",
      brandChannels,
      storyBackground,
      servicePreference: `fabp-${type}`,
      marketingBudget,
    },
    interviewerId: null,
    advisorId: null,
    landingPageId: null,
  };
}

function bviUrl(): string {
  const base = (process.env.BVI_API_BASE_URL || DEFAULT_BVI_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const path = process.env.BVI_API_PATH || DEFAULT_BVI_PATH;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function isRetryable(status: number | undefined, error?: string): boolean {
  if (error) return true; // network / unexpected
  if (!status) return false;
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SinglePostResult {
  responseStatus?: number;
  responseBody?: string;
  error?: string;
}

async function postOnce(
  url: string,
  payload: BviIntakePayload,
  idemKey: string,
  timeoutMs = 15_000,
): Promise<SinglePostResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Some BVI deployments accept Idempotency-Key as a hint; harmless if
        // ignored. Combined with email-level dedup on the BVI side, this
        // prevents duplicate Kanban rows on retries.
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await res.text();
    return { responseStatus: res.status, responseBody: text };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractExternalId(body: string | undefined): string | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const interviewee = parsed.interviewee as Record<string, unknown> | undefined;
    if (interviewee && typeof interviewee.id === "string") return interviewee.id;
    const user = parsed.user as Record<string, unknown> | undefined;
    if (user && typeof user.id === "string") return user.id;
  } catch {
    // BVI returned non-JSON; ignore.
  }
  return undefined;
}

/**
 * Push a single lead to the BVI Flow Tracker with retry & exponential backoff.
 * Does NOT touch the database — callers are responsible for persisting state
 * via lib/leads helpers (`updatePlaybookLead`, `recordBviAttempt`, etc.).
 */
export async function pushLeadToBvi(
  type: LeadType,
  lead: PlaybookLead | InvitationLead,
  options: { onAttempt?: (n: number, result: SinglePostResult) => Promise<void> | void } = {},
): Promise<BviPushResult> {
  const payload = mapLeadToIntake(type, lead);
  const idemKey = idempotencyKey(type, lead.id);
  const url = bviUrl();

  let last: SinglePostResult = {};
  let attempts = 0;

  for (let i = 0; i < MAX_PUSH_ATTEMPTS; i++) {
    attempts = i + 1;
    last = await postOnce(url, payload, idemKey);
    if (options.onAttempt) await options.onAttempt(attempts, last);

    const ok =
      typeof last.responseStatus === "number" &&
      last.responseStatus >= 200 &&
      last.responseStatus < 300;
    if (ok) {
      return {
        ok: true,
        attempts,
        responseStatus: last.responseStatus,
        responseBody: last.responseBody,
        externalId: extractExternalId(last.responseBody),
        request: payload,
      };
    }
    if (!isRetryable(last.responseStatus, last.error)) break;
    if (i < MAX_PUSH_ATTEMPTS - 1) {
      await sleep(RETRY_BACKOFF_MS[Math.min(i, RETRY_BACKOFF_MS.length - 1)]);
    }
  }

  return {
    ok: false,
    attempts,
    responseStatus: last.responseStatus,
    responseBody: last.responseBody,
    error: last.error,
    request: payload,
  };
}

export const __test__ = {
  isRetryable,
  extractExternalId,
  bviUrl,
};
