import { query, withClient } from "@/lib/db";

export type LeadType = "playbook" | "invitation";

export const PLAYBOOK_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
  "archived",
] as const;
export type PlaybookStatus = (typeof PLAYBOOK_STATUSES)[number];

export const INVITATION_STATUSES = [
  "new",
  "screening",
  "interview_scheduled",
  "listed",
  "disqualified",
  "won",
  "lost",
  "archived",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_STEPS = [
  "apply",
  "brand_voice_interview",
  "listed",
] as const;
export type InvitationStep = (typeof INVITATION_STEPS)[number];

export const BVI_SYNC_STATUSES = [
  "pending",
  "synced",
  "failed",
  "skipped",
  "in_flight",
] as const;
export type BviSyncStatus = (typeof BVI_SYNC_STATUSES)[number];

export interface PlaybookLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  consent: boolean;
  industry_slug: string;
  user_agent: string | null;
  ip_address: string | null;
  submitted_at: string;
  slack_status: string;
  status: PlaybookStatus;
  assigned_to: string | null;
  bvi_external_id: string | null;
  bvi_sync_status: BviSyncStatus;
  bvi_synced_at: string | null;
  bvi_last_error: string | null;
  bvi_idempotency_key: string | null;
  bvi_attempts: number;
  deleted_at: string | null;
  updated_at: string;
}

export interface InvitationLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  profession: string | null;
  city: string | null;
  state: string | null;
  years: string | null;
  website: string | null;
  spend: string | null;
  fit: string | null;
  industry_slug: string;
  variant: string | null;
  user_agent: string | null;
  ip_address: string | null;
  submitted_at: string;
  status: InvitationStatus;
  invitation_step: InvitationStep;
  interview_scheduled_at: string | null;
  listing_published_at: string | null;
  assigned_to: string | null;
  bd_status: "pending" | "created" | "failed";
  bd_error: string | null;
  bd_user_id: string | null;
  failed_submission_id: number | null;
  bvi_external_id: string | null;
  bvi_sync_status: BviSyncStatus;
  bvi_synced_at: string | null;
  bvi_last_error: string | null;
  bvi_idempotency_key: string | null;
  bvi_attempts: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Lead =
  | ({ lead_type: "playbook" } & PlaybookLead)
  | ({ lead_type: "invitation" } & InvitationLead);

export interface LeadNote {
  id: number;
  lead_type: LeadType;
  lead_id: number;
  author: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface LeadEvent {
  id: number;
  lead_type: LeadType;
  lead_id: number;
  event_type: string;
  actor: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

const PLAYBOOK_COLUMNS = `
  id, first_name, last_name, email, phone, consent, industry_slug,
  user_agent, ip_address, submitted_at, slack_status,
  status, assigned_to,
  bvi_external_id, bvi_sync_status, bvi_synced_at, bvi_last_error,
  bvi_idempotency_key, bvi_attempts,
  deleted_at, updated_at
`;

const INVITATION_COLUMNS = `
  id, first_name, last_name, email, phone, company,
  profession, city, state, years, website, spend, fit,
  industry_slug, variant, user_agent, ip_address, submitted_at,
  status, invitation_step, interview_scheduled_at, listing_published_at,
  assigned_to,
  bd_status, bd_error, bd_user_id, failed_submission_id,
  bvi_external_id, bvi_sync_status, bvi_synced_at, bvi_last_error,
  bvi_idempotency_key, bvi_attempts,
  deleted_at, created_at, updated_at
`;

export interface ListLeadsFilter {
  industry?: string;
  status?: string;
  bviSyncStatus?: BviSyncStatus;
  search?: string;
  includeDeleted?: boolean;
}

function buildWhere(
  filter: ListLeadsFilter,
  extraConditions: string[] = [],
): { sql: string; params: unknown[] } {
  const conditions: string[] = [...extraConditions];
  const params: unknown[] = [];

  if (!filter.includeDeleted) conditions.push("deleted_at IS NULL");
  if (filter.industry) {
    params.push(filter.industry);
    conditions.push(`industry_slug = $${params.length}`);
  }
  if (filter.status) {
    params.push(filter.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filter.bviSyncStatus) {
    params.push(filter.bviSyncStatus);
    conditions.push(`bvi_sync_status = $${params.length}`);
  }
  if (filter.search) {
    params.push(`%${filter.search.toLowerCase()}%`);
    const i = params.length;
    conditions.push(
      `(LOWER(first_name) LIKE $${i} OR LOWER(last_name) LIKE $${i} OR LOWER(email) LIKE $${i})`,
    );
  }

  return {
    sql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function listPlaybookLeads(
  filter: ListLeadsFilter = {},
): Promise<PlaybookLead[]> {
  const { sql, params } = buildWhere(filter);
  const result = await query(
    `SELECT ${PLAYBOOK_COLUMNS}
       FROM playbook_leads
       ${sql}
       ORDER BY submitted_at DESC`,
    params,
  );
  return result.rows as PlaybookLead[];
}

export async function listInvitationLeads(
  filter: ListLeadsFilter = {},
): Promise<InvitationLead[]> {
  const { sql, params } = buildWhere(filter);
  const result = await query(
    `SELECT ${INVITATION_COLUMNS}
       FROM invitation_leads
       ${sql}
       ORDER BY submitted_at DESC`,
    params,
  );
  return result.rows as InvitationLead[];
}

export async function getPlaybookLead(id: number): Promise<PlaybookLead | null> {
  const result = await query(
    `SELECT ${PLAYBOOK_COLUMNS} FROM playbook_leads WHERE id = $1`,
    [id],
  );
  return (result.rows[0] as PlaybookLead) ?? null;
}

export async function getInvitationLead(
  id: number,
): Promise<InvitationLead | null> {
  const result = await query(
    `SELECT ${INVITATION_COLUMNS} FROM invitation_leads WHERE id = $1`,
    [id],
  );
  return (result.rows[0] as InvitationLead) ?? null;
}

export async function getLead(
  type: LeadType,
  id: number,
): Promise<PlaybookLead | InvitationLead | null> {
  return type === "playbook" ? getPlaybookLead(id) : getInvitationLead(id);
}

const PLAYBOOK_PATCH_FIELDS = new Set([
  "status",
  "assigned_to",
  "bvi_sync_status",
  "bvi_external_id",
  "bvi_synced_at",
  "bvi_last_error",
  "bvi_idempotency_key",
  "bvi_attempts",
]);

const INVITATION_PATCH_FIELDS = new Set([
  "status",
  "invitation_step",
  "interview_scheduled_at",
  "listing_published_at",
  "assigned_to",
  "bd_status",
  "bd_error",
  "bd_user_id",
  "failed_submission_id",
  "bvi_sync_status",
  "bvi_external_id",
  "bvi_synced_at",
  "bvi_last_error",
  "bvi_idempotency_key",
  "bvi_attempts",
]);

function buildUpdateFragment(
  patch: Record<string, unknown>,
  allowed: Set<string>,
): { setSql: string; params: unknown[] } | null {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(patch)) {
    if (!allowed.has(key)) continue;
    params.push(value);
    sets.push(`${key} = $${params.length}`);
  }
  if (sets.length === 0) return null;
  return { setSql: sets.join(", "), params };
}

export async function updatePlaybookLead(
  id: number,
  patch: Partial<PlaybookLead>,
): Promise<PlaybookLead | null> {
  const frag = buildUpdateFragment(
    patch as Record<string, unknown>,
    PLAYBOOK_PATCH_FIELDS,
  );
  if (!frag) return getPlaybookLead(id);
  frag.params.push(id);
  const result = await query(
    `UPDATE playbook_leads
        SET ${frag.setSql}, updated_at = NOW()
      WHERE id = $${frag.params.length}
      RETURNING ${PLAYBOOK_COLUMNS}`,
    frag.params,
  );
  return (result.rows[0] as PlaybookLead) ?? null;
}

export async function updateInvitationLead(
  id: number,
  patch: Partial<InvitationLead>,
): Promise<InvitationLead | null> {
  const frag = buildUpdateFragment(
    patch as Record<string, unknown>,
    INVITATION_PATCH_FIELDS,
  );
  if (!frag) return getInvitationLead(id);
  frag.params.push(id);
  const result = await query(
    `UPDATE invitation_leads
        SET ${frag.setSql}, updated_at = NOW()
      WHERE id = $${frag.params.length}
      RETURNING ${INVITATION_COLUMNS}`,
    frag.params,
  );
  return (result.rows[0] as InvitationLead) ?? null;
}

export async function softDeleteLead(
  type: LeadType,
  id: number,
): Promise<boolean> {
  const table = type === "playbook" ? "playbook_leads" : "invitation_leads";
  const result = await query(
    `UPDATE ${table}
        SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

// ---------- Notes ----------

export async function listNotes(
  type: LeadType,
  leadId: number,
): Promise<LeadNote[]> {
  const result = await query(
    `SELECT id, lead_type, lead_id, author, body, created_at, updated_at
       FROM lead_notes
      WHERE lead_type = $1 AND lead_id = $2
      ORDER BY created_at DESC`,
    [type, leadId],
  );
  return result.rows as LeadNote[];
}

export async function createNote(
  type: LeadType,
  leadId: number,
  body: string,
  author = "admin",
): Promise<LeadNote> {
  const result = await query(
    `INSERT INTO lead_notes (lead_type, lead_id, author, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, lead_type, lead_id, author, body, created_at, updated_at`,
    [type, leadId, author, body],
  );
  return result.rows[0] as LeadNote;
}

export async function updateNote(
  noteId: number,
  body: string,
): Promise<LeadNote | null> {
  const result = await query(
    `UPDATE lead_notes
        SET body = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, lead_type, lead_id, author, body, created_at, updated_at`,
    [body, noteId],
  );
  return (result.rows[0] as LeadNote) ?? null;
}

export async function deleteNote(noteId: number): Promise<boolean> {
  const result = await query(`DELETE FROM lead_notes WHERE id = $1`, [noteId]);
  return (result.rowCount ?? 0) > 0;
}

// ---------- Events (activity log) ----------

export async function recordEvent(
  type: LeadType,
  leadId: number,
  eventType: string,
  payload?: Record<string, unknown>,
  actor: string | null = "admin",
): Promise<void> {
  await query(
    `INSERT INTO lead_events (lead_type, lead_id, event_type, actor, payload)
       VALUES ($1, $2, $3, $4, $5)`,
    [type, leadId, eventType, actor, payload ? JSON.stringify(payload) : null],
  );
}

export async function listEvents(
  type: LeadType,
  leadId: number,
  limit = 200,
): Promise<LeadEvent[]> {
  const result = await query(
    `SELECT id, lead_type, lead_id, event_type, actor, payload, created_at
       FROM lead_events
      WHERE lead_type = $1 AND lead_id = $2
      ORDER BY created_at DESC
      LIMIT $3`,
    [type, leadId, limit],
  );
  return result.rows as LeadEvent[];
}

// ---------- BVI sync log ----------

export interface BviSyncLogRow {
  id: number;
  lead_type: LeadType;
  lead_id: number;
  attempt: number;
  request_body: Record<string, unknown> | null;
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  created_at: string;
}

export async function recordBviAttempt(
  type: LeadType,
  leadId: number,
  attempt: number,
  requestBody: unknown,
  result: {
    responseStatus?: number;
    responseBody?: string;
    error?: string;
  },
): Promise<void> {
  await query(
    `INSERT INTO bvi_sync_log
        (lead_type, lead_id, attempt, request_body,
         response_status, response_body, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      type,
      leadId,
      attempt,
      requestBody ? JSON.stringify(requestBody) : null,
      result.responseStatus ?? null,
      result.responseBody ?? null,
      result.error ?? null,
    ],
  );
}

export async function listBviAttempts(
  type: LeadType,
  leadId: number,
): Promise<BviSyncLogRow[]> {
  const result = await query(
    `SELECT id, lead_type, lead_id, attempt, request_body,
            response_status, response_body, error, created_at
       FROM bvi_sync_log
      WHERE lead_type = $1 AND lead_id = $2
      ORDER BY created_at DESC`,
    [type, leadId],
  );
  return result.rows as BviSyncLogRow[];
}

// ---------- Atomic claim helpers (for cron retry) ----------

/**
 * Atomically claim a lead for a BVI push attempt: flips bvi_sync_status from
 * 'pending'|'failed' to 'in_flight' and increments bvi_attempts. Returns the
 * lead row if the claim succeeded, or null if another worker beat us to it.
 */
export async function claimLeadForBviSync(
  type: LeadType,
  id: number,
): Promise<PlaybookLead | InvitationLead | null> {
  const table = type === "playbook" ? "playbook_leads" : "invitation_leads";
  const cols = type === "playbook" ? PLAYBOOK_COLUMNS : INVITATION_COLUMNS;
  return await withClient(async (client) => {
    await client.query("BEGIN");
    const res = await client.query(
      `UPDATE ${table}
          SET bvi_sync_status = 'in_flight',
              bvi_attempts = bvi_attempts + 1,
              updated_at = NOW()
        WHERE id = $1
          AND bvi_sync_status IN ('pending','failed')
          AND deleted_at IS NULL
        RETURNING ${cols}`,
      [id],
    );
    await client.query("COMMIT");
    return (res.rows[0] as PlaybookLead | InvitationLead) ?? null;
  });
}

export const __test__ = {
  buildUpdateFragment,
  PLAYBOOK_PATCH_FIELDS,
  INVITATION_PATCH_FIELDS,
};

export async function listLeadsNeedingBviSync(
  type: LeadType,
  limit = 50,
): Promise<{ id: number }[]> {
  const table = type === "playbook" ? "playbook_leads" : "invitation_leads";
  const result = await query(
    `SELECT id FROM ${table}
      WHERE bvi_sync_status IN ('pending','failed')
        AND deleted_at IS NULL
      ORDER BY submitted_at ASC
      LIMIT $1`,
    [limit],
  );
  return result.rows as { id: number }[];
}
