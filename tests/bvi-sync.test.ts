import { describe, expect, it, vi } from "vitest";

const playbookLead = {
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  phone: "555",
  consent: true,
  industry_slug: "cpas",
  user_agent: null,
  ip_address: null,
  submitted_at: "2026-01-01T00:00:00Z",
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
  updated_at: "2026-01-01T00:00:00Z",
};

const invitationLead = {
  ...playbookLead,
  id: 7,
  industry_slug: "fractional-cfos",
  invitation_step: "apply",
  interview_scheduled_at: null,
  listing_published_at: null,
  bd_status: "pending",
  bd_error: null,
  bd_user_id: null,
  failed_submission_id: null,
  variant: null,
  company: "Acme",
  profession: "CFO",
  city: "Charlotte",
  state: "NC",
  years: "12",
  website: "x.com",
  spend: "$1k",
  fit: "good",
  created_at: "2026-01-01T00:00:00Z",
};

vi.mock("@/lib/leads", async () => {
  return {
    claimLeadForBviSync: vi.fn(async (type: "playbook" | "invitation") =>
      type === "playbook" ? playbookLead : invitationLead,
    ),
    updatePlaybookLead: vi.fn(),
    updateInvitationLead: vi.fn(),
    recordBviAttempt: vi.fn(),
    recordEvent: vi.fn(),
    listLeadsNeedingBviSync: vi.fn(async () => []),
    getPlaybookLead: vi.fn(),
    getInvitationLead: vi.fn(),
  };
});

const fetchMock = vi.fn(async () =>
  new Response(JSON.stringify({ interviewee: { id: "ext-1" } }), { status: 201 }),
);
globalThis.fetch = fetchMock as unknown as typeof fetch;

import { syncLeadToBvi } from "@/lib/bvi-sync";
import {
  recordEvent,
  updateInvitationLead,
  updatePlaybookLead,
} from "@/lib/leads";

describe("syncLeadToBvi", () => {
  it("posts to BVI with the playbook payload and updates the playbook table on success", async () => {
    fetchMock.mockClear();
    const result = await syncLeadToBvi("playbook", 1, "test");
    expect(result.ok).toBe(true);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.intakeData.servicePreference).toBe("fabp-playbook");
    expect(updatePlaybookLead).toHaveBeenCalledWith(1, expect.objectContaining({
      bvi_sync_status: "synced",
      bvi_idempotency_key: "fabp-playbook-1",
    }));
    expect(recordEvent).toHaveBeenCalledWith(
      "playbook",
      1,
      "bvi_synced",
      expect.any(Object),
      "test",
    );
  });

  it("posts to BVI with the invitation payload and updates the invitation table on success", async () => {
    fetchMock.mockClear();
    (updatePlaybookLead as unknown as ReturnType<typeof vi.fn>).mockClear();
    (updateInvitationLead as unknown as ReturnType<typeof vi.fn>).mockClear();
    const result = await syncLeadToBvi("invitation", 7, "test");
    expect(result.ok).toBe(true);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.intakeData.servicePreference).toBe("fabp-invitation");
    expect(updateInvitationLead).toHaveBeenCalledWith(7, expect.objectContaining({
      bvi_sync_status: "synced",
      bvi_idempotency_key: "fabp-invitation-7",
    }));
  });
});
