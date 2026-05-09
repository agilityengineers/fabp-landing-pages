import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface Call {
  sql: string;
  params: unknown[];
}

const calls: Call[] = [];
let nextResult: { rows: unknown[]; rowCount?: number } = { rows: [] };

vi.mock("@/lib/db", () => ({
  query: vi.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    return nextResult;
  }),
  withClient: vi.fn(async (fn: (client: { query: typeof queryFn }) => Promise<unknown>) => {
    const queryFn = async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return nextResult;
    };
    return fn({ query: queryFn });
  }),
}));

import {
  __test__,
  createNote,
  listInvitationLeads,
  listPlaybookLeads,
  recordEvent,
  softDeleteLead,
  updateInvitationLead,
  updatePlaybookLead,
} from "@/lib/leads";

beforeEach(() => {
  calls.length = 0;
  nextResult = { rows: [] };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listPlaybookLeads / listInvitationLeads", () => {
  it("scopes to the correct table and excludes deleted by default", async () => {
    nextResult = { rows: [{ id: 1 }] };
    await listPlaybookLeads({});
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toMatch(/FROM playbook_leads/);
    expect(calls[0].sql).toMatch(/deleted_at IS NULL/);

    calls.length = 0;
    await listInvitationLeads({});
    expect(calls[0].sql).toMatch(/FROM invitation_leads/);
  });

  it("applies industry, status, and search filters with parameterized queries", async () => {
    await listInvitationLeads({
      industry: "cpas",
      status: "screening",
      search: "Reyes",
    });
    const c = calls[0];
    expect(c.sql).toMatch(/industry_slug = \$1/);
    expect(c.sql).toMatch(/status = \$2/);
    expect(c.sql).toMatch(/LOWER\(first_name\) LIKE \$3/);
    expect(c.params).toEqual(["cpas", "screening", "%reyes%"]);
  });

  it("includes deleted rows when explicitly asked", async () => {
    await listPlaybookLeads({ includeDeleted: true });
    expect(calls[0].sql).not.toMatch(/deleted_at IS NULL/);
  });
});

describe("update*", () => {
  it("only sends whitelisted fields", async () => {
    nextResult = { rows: [{ id: 7 }] };
    await updatePlaybookLead(7, {
      status: "contacted",
      // @ts-expect-error first_name is not in the patch whitelist
      first_name: "should-not-pass",
      assigned_to: "alice",
    });
    expect(calls[0].sql).toMatch(/SET status = \$1, assigned_to = \$2/);
    expect(calls[0].params).toEqual(["contacted", "alice", 7]);
  });

  it("filters disallowed invitation fields", async () => {
    nextResult = { rows: [{ id: 9 }] };
    await updateInvitationLead(9, {
      invitation_step: "brand_voice_interview",
      // @ts-expect-error not whitelisted
      email: "haxxor@x",
    });
    expect(calls[0].sql).toMatch(/invitation_step = \$1/);
    // The disallowed `email` field must not appear in the SET clause.
    const setClause = calls[0].sql.split("RETURNING")[0];
    expect(setClause).not.toMatch(/\bemail\b/);
  });
});

describe("softDeleteLead", () => {
  it("targets the correct table for each lead type", async () => {
    nextResult = { rows: [{ id: 1 }], rowCount: 1 };
    await softDeleteLead("playbook", 1);
    expect(calls[0].sql).toMatch(/UPDATE playbook_leads/);
    calls.length = 0;
    await softDeleteLead("invitation", 1);
    expect(calls[0].sql).toMatch(/UPDATE invitation_leads/);
  });
});

describe("notes & events", () => {
  it("createNote writes lead_type and lead_id", async () => {
    nextResult = { rows: [{ id: 10 }] };
    await createNote("invitation", 5, "follow up Tuesday", "alice");
    expect(calls[0].params).toEqual(["invitation", 5, "alice", "follow up Tuesday"]);
  });

  it("recordEvent serializes payload to JSON", async () => {
    await recordEvent("playbook", 3, "status_changed", { from: "new", to: "qualified" });
    expect(calls[0].params[3]).toBe("admin");
    expect(calls[0].params[4]).toBe(JSON.stringify({ from: "new", to: "qualified" }));
  });
});

describe("buildUpdateFragment", () => {
  it("returns null when no allowed fields are present", () => {
    const result = __test__.buildUpdateFragment(
      { foo: "bar" },
      new Set(["status"]),
    );
    expect(result).toBeNull();
  });

  it("only places whitelisted fields into the SET clause", () => {
    const result = __test__.buildUpdateFragment(
      { status: "won", banned: true },
      new Set(["status"]),
    );
    expect(result?.setSql).toBe("status = $1");
    expect(result?.params).toEqual(["won"]);
  });
});
