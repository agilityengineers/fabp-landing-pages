import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __test__,
  idempotencyKey,
  mapLeadToIntake,
  pushLeadToBvi,
} from "@/lib/bvi-client";
import type { InvitationLead, PlaybookLead } from "@/lib/leads";

const playbook: PlaybookLead = {
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  phone: "555-0100",
  consent: true,
  industry_slug: "cpas",
  user_agent: null,
  ip_address: null,
  submitted_at: "2026-01-01T00:00:00.000Z",
  slack_status: "sent",
  status: "new",
  assigned_to: null,
  bvi_external_id: null,
  bvi_sync_status: "pending",
  bvi_synced_at: null,
  bvi_last_error: null,
  bvi_idempotency_key: null,
  bvi_attempts: 0,
  deleted_at: null,
  updated_at: "2026-01-01T00:00:00.000Z",
};

const invitation: InvitationLead = {
  id: 42,
  first_name: "Sam",
  last_name: "Reyes",
  email: "sam@firm.com",
  phone: "555-0202",
  company: "Reyes & Co",
  profession: "Fractional CFO",
  city: "Charlotte",
  state: "NC",
  years: "12",
  website: "firm.com",
  spend: "$5,000 – $15,000",
  fit: "Senior team, 4 partners",
  industry_slug: "fractional-cfos",
  variant: null,
  user_agent: null,
  ip_address: null,
  submitted_at: "2026-01-02T00:00:00.000Z",
  status: "new",
  invitation_step: "apply",
  interview_scheduled_at: null,
  listing_published_at: null,
  assigned_to: null,
  bd_status: "pending",
  bd_error: null,
  bd_user_id: null,
  failed_submission_id: null,
  bvi_external_id: null,
  bvi_sync_status: "pending",
  bvi_synced_at: null,
  bvi_last_error: null,
  bvi_idempotency_key: null,
  bvi_attempts: 0,
  deleted_at: null,
  created_at: "2026-01-02T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("idempotencyKey", () => {
  it("encodes type and id", () => {
    expect(idempotencyKey("playbook", 1)).toBe("fabp-playbook-1");
    expect(idempotencyKey("invitation", 42)).toBe("fabp-invitation-42");
  });
});

describe("mapLeadToIntake", () => {
  it("populates required user fields and shape for a playbook lead", () => {
    const payload = mapLeadToIntake("playbook", playbook);
    expect(payload.userData.email).toBe("jane@example.com");
    expect(payload.userData.name).toBe("Jane Doe");
    expect(payload.intakeData.brandChannels).toEqual(["FABP"]);
    expect(payload.intakeData.servicePreference).toBe("fabp-playbook");
    expect(payload.intakeData.storyBackground).toContain("playbook");
    expect(payload.intakeData.storyBackground).toContain("cpas");
    // Required intake keys present
    for (const key of [
      "elevatorPitch",
      "knownFor",
      "targetAudience",
      "marketingFrustration",
      "referralHope",
      "brandTone",
      "uniqueBelief",
      "brandChannels",
      "storyBackground",
    ]) {
      expect(payload.intakeData).toHaveProperty(key);
    }
  });

  it("differentiates invitation leads via servicePreference and storyBackground", () => {
    const playbookPayload = mapLeadToIntake("playbook", playbook);
    const invitationPayload = mapLeadToIntake("invitation", invitation);
    expect(invitationPayload.intakeData.servicePreference).toBe("fabp-invitation");
    expect(playbookPayload.intakeData.servicePreference).toBe("fabp-playbook");
    expect(invitationPayload.intakeData.storyBackground).toContain("invitation");
    expect(invitationPayload.intakeData.storyBackground).toContain(
      "fractional-cfos",
    );
    expect(invitationPayload.intakeData.marketingFrustration).toContain(
      "Senior team",
    );
    expect(invitationPayload.intakeData.marketingBudget).toBe(invitation.spend);
  });

  it("falls back to email when both name parts are blank", () => {
    const blank = { ...playbook, first_name: "", last_name: "" };
    const payload = mapLeadToIntake("playbook", blank);
    expect(payload.userData.name).toBe(playbook.email);
  });
});

describe("isRetryable", () => {
  it("retries on network error", () => {
    expect(__test__.isRetryable(undefined, "ECONNRESET")).toBe(true);
  });
  it("retries on 5xx and 429", () => {
    expect(__test__.isRetryable(500)).toBe(true);
    expect(__test__.isRetryable(503)).toBe(true);
    expect(__test__.isRetryable(429)).toBe(true);
  });
  it("does not retry on 4xx other than 429", () => {
    expect(__test__.isRetryable(400)).toBe(false);
    expect(__test__.isRetryable(404)).toBe(false);
  });
  it("does not retry on 2xx (caller treats as success)", () => {
    expect(__test__.isRetryable(201)).toBe(false);
  });
});

describe("extractExternalId", () => {
  it("returns interviewee.id when present", () => {
    const body = JSON.stringify({ interviewee: { id: "int-123" } });
    expect(__test__.extractExternalId(body)).toBe("int-123");
  });
  it("falls back to user.id", () => {
    const body = JSON.stringify({ user: { id: "user-9" } });
    expect(__test__.extractExternalId(body)).toBe("user-9");
  });
  it("returns undefined for non-JSON", () => {
    expect(__test__.extractExternalId("hello")).toBeUndefined();
    expect(__test__.extractExternalId(undefined)).toBeUndefined();
  });
});

describe("pushLeadToBvi", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("returns ok=true on 201 and extracts externalId", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ interviewee: { id: "int-77" } }),
        { status: 201 },
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await pushLeadToBvi("invitation", invitation);
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.externalId).toBe("int-77");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("fabp-invitation-42");
  });

  it("retries on transient 503 then succeeds", async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls++;
      if (calls < 2) {
        return new Response("nope", { status: 503 });
      }
      return new Response(JSON.stringify({ interviewee: { id: "int-1" } }), {
        status: 201,
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const promise = pushLeadToBvi("playbook", playbook);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 400 and reports the error", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: "bad" }), { status: 400 }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const result = await pushLeadToBvi("playbook", playbook);
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.responseStatus).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
