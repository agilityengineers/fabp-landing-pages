# Leads Management System

This document describes the unified leads pipeline that consolidates submissions
from every industry-specific landing page into two admin views — **Playbook
Leads** and **Invitation Leads** — and pushes those leads to the
[Brand Voice Interview](https://brand-voice-interview.com) (BVI) Flow Tracker.

## Overview

The system has two distinct lead sources with different downstream behavior:

| Source                | Form on landing page             | Downstream                                           |
| --------------------- | -------------------------------- | ---------------------------------------------------- |
| `playbook`            | `components/landing/PlaybookForm.tsx` (gated PDF) | Stored in `playbook_leads`. Slack ping. PDF link returned. |
| `invitation`          | `components/landing/Apply.tsx` (Apply to be listed) | Stored in `invitation_leads`. Brilliant Directories user_create. |

Every submission of either type **also** fires a best-effort push to BVI so a
sales rep on BVI's Kanban board sees the lead in their existing flow. The push
is idempotent (BVI dedupes by email; we additionally track `bvi_idempotency_key`).
Failures are recorded and retried, never thrown back to the user.

## Data model

```
playbook_leads          (extended; see db/schema.sql)
invitation_leads        (new)
lead_notes              (polymorphic: lead_type + lead_id)
lead_events             (polymorphic activity log)
bvi_sync_log            (per-attempt request/response trace)
failed_submissions      (existing — BD member-create failures)
```

`lead_type` is the discriminator string `'playbook' | 'invitation'`. There are
no foreign keys from the polymorphic child tables back to the lead rows; this
is intentional so a single child table can serve both lead types. Code paths in
`lib/leads.ts` enforce the relationship.

### Key columns added to `playbook_leads`

| Column                  | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `status`                | Pipeline status (new, contacted, …, archived). |
| `assigned_to`           | Admin / rep handling the lead.             |
| `bvi_sync_status`       | `pending`, `synced`, `failed`, `skipped`, `in_flight`. |
| `bvi_external_id`       | Interviewee id returned by BVI.            |
| `bvi_idempotency_key`   | `fabp-playbook-{id}`; unique partial index. |
| `bvi_attempts`          | Counter; bumped on each push attempt.      |
| `bvi_last_error`        | Last failure message (truncated).          |
| `bvi_synced_at`         | Last successful push timestamp.            |
| `deleted_at`            | Soft-delete marker.                        |
| `updated_at`            | Auto-set on every update.                  |

### `invitation_leads` (new)

In addition to all the playbook-style management columns, `invitation_leads`
stores the full Apply form (profession, city/state, years, website, spend, fit)
plus pipeline state for the 3-step invitation flow:

- `invitation_step` — `apply` | `brand_voice_interview` | `listed`
- `interview_scheduled_at` / `listing_published_at`
- `bd_status` — `pending` | `created` | `failed` (downstream BD outcome)
- `bd_user_id` — the Brilliant Directories user id, when known
- `failed_submission_id` — link to a `failed_submissions` row when BD failed

## Surfaces

### Public form endpoints

- `POST /api/playbook-leads` — inserts into `playbook_leads`, posts Slack,
  returns presigned PDF URL, then fires a fire-and-forget BVI push.
- `POST /api/applications` — inserts into `invitation_leads` with
  `bd_status = 'pending'`, calls Brilliant Directories, updates `bd_status`
  to `created` or `failed`, then fires a BVI push regardless of BD outcome.

### Admin pages

- `/admin/playbook-leads` (sidebar: **Playbook leads**)
- `/admin/invitation-leads` (sidebar: **Invitation leads**)
- `/admin/leads` redirects to `/admin/playbook-leads` for legacy bookmarks.

Both pages render `components/admin/LeadsManager` and offer:

- Search by name / email
- Filter by industry, status, BVI sync state
- CSV export
- Click a row to open a side drawer with: full lead detail, status & step
  controls, assigned-to, scheduled-interview datetime, notes (CRUD),
  activity log, BVI sync status with a "Push to BVI" button and per-attempt
  log, and soft-delete.

The Invitation Leads drawer additionally surfaces a **Next action** prompt
based on the current step / BD status / BVI sync state.

### Admin API

All routes require the `admin-auth=1` cookie (re-checked inline; not just at
the middleware boundary).

| Method | Path                                                   | Notes                                  |
| ------ | ------------------------------------------------------ | -------------------------------------- |
| GET    | `/api/admin/leads?type=playbook\|invitation`           | Optional `industry`, `status`, `search`, `bvi`, `format=csv`. |
| GET    | `/api/admin/leads/:type/:id`                           | Returns lead + notes + events + bvi attempts. |
| PATCH  | `/api/admin/leads/:type/:id`                           | Whitelisted fields only (status, assigned_to, etc.). |
| DELETE | `/api/admin/leads/:type/:id`                           | Soft delete.                           |
| POST   | `/api/admin/leads/:type/:id/notes`                     | Create note.                           |
| PATCH  | `/api/admin/leads/:type/:id/notes/:noteId`             | Edit note.                             |
| DELETE | `/api/admin/leads/:type/:id/notes/:noteId`             | Delete note.                           |
| POST   | `/api/admin/leads/:type/:id/sync-bvi`                  | Manual retry; returns `BviPushResult`. |
| POST   | `/api/cron/sync-bvi`                                   | Background catch-up. Auth: `x-cron-secret` header (preferred) or admin cookie. |
| POST   | `/api/webhooks/bvi`                                    | Inbound BVI status updates. HMAC-signed (`x-bvi-signature: sha256=…`) using `BVI_WEBHOOK_SECRET`. |

## BVI integration

### Endpoint

The BVI Flow Tracker exposes a public, no-auth endpoint:

```
POST https://brand-voice-interview.com/api/public/intake-submit
Content-Type: application/json
```

The endpoint creates / reuses the user (deduped by email), creates an
`intake_responses` row, and creates an `interviewees` row on the first Kanban
stage. The 201 response returns `{ user, intakeResponse, interviewee }`.

### Mapping FABP leads → BVI intake payload

Implemented in `lib/bvi-client.ts:mapLeadToIntake`. The BVI endpoint has no
native `lead_type` or `industry` field, so we encode the source distinction
where it is most visible to a sales rep:

- `intakeData.servicePreference` = `"fabp-playbook"` or `"fabp-invitation"`
- `intakeData.storyBackground` = a single-sentence summary that prefixes
  `Source: FABP <type> lead from <industry> landing page.` and includes the
  idempotency key. For invitation leads, we also include profession, market,
  years in practice, website, marketing spend, and the current FABP step.
- `intakeData.knownFor` = profession + market for invitations; industry slug
  for playbook downloads.
- `intakeData.marketingFrustration` = the applicant's "why a fit" answer
  (invitation only).
- `intakeData.brandChannels` = `["FABP"]`.

If BVI later adds a proper `lead_type` field (or ships the lean
`POST /api/public/lead` variant they offered), update `mapLeadToIntake` —
nothing else in the codebase changes.

### Idempotency, retry, sync state

- We send `Idempotency-Key: fabp-<type>-<id>` as a request header (BVI may or
  may not act on it; harmless if ignored). BVI's email-level dedup makes this
  belt-and-braces.
- `pushLeadToBvi` retries up to 4 times with backoff (500ms → 1.5s → 4s) on
  network errors, 429, and 5xx. 4xx other than 429 are treated as terminal.
- Every attempt is logged to `bvi_sync_log` with the response status and a
  truncated body. Failures land the row in `bvi_sync_status='failed'`.
- The cron job `/api/cron/sync-bvi` re-tries any rows in `pending` or
  `failed`. Wire it to a Replit scheduled task or any external cron POSTing
  with header `x-cron-secret: $CRON_SECRET`.

### Inbound webhook

`POST /api/webhooks/bvi` is scaffolded for the future case where BVI emits
status updates back to us. Signature scheme: HMAC-SHA256 over the raw body
using `BVI_WEBHOOK_SECRET`, header `x-bvi-signature: sha256=<hex>`.
Recognized events (mappable to invitation pipeline state):

- `interview_scheduled` → sets `invitation_step = 'brand_voice_interview'`,
  `status = 'interview_scheduled'`, `interview_scheduled_at = occurred_at`.
- `listing_published` → sets `invitation_step = 'listed'`,
  `status = 'listed'`, `listing_published_at = occurred_at`.

If BVI's eventual webhook contract differs, change `verifySignature()` and
the body parser in `app/api/webhooks/bvi/route.ts` only.

## Environment variables

Required for BVI integration:

| Var                  | Default                                      | Notes                                       |
| -------------------- | -------------------------------------------- | ------------------------------------------- |
| `BVI_API_BASE_URL`   | `https://brand-voice-interview.com`          | Override for staging.                       |
| `BVI_API_PATH`       | `/api/public/intake-submit`                  | Override if BVI ships the lean endpoint.    |
| `BVI_WEBHOOK_SECRET` | (unset → webhook rejects all requests)       | Set when BVI starts sending status updates. |
| `CRON_SECRET`        | (optional)                                   | Header-auth for the catch-up cron route.    |

Existing variables already documented in `.env.example` (`DATABASE_URL`,
`ADMIN_PASSWORD`, `BD_API_KEY`, `PLAYBOOK_SLACK_WEBHOOK_URL`,
`ALERT_WEBHOOK_URL`, etc.) all continue to apply unchanged.

## Migration

The leads-management columns are added to `db/schema.sql` with
`ADD COLUMN IF NOT EXISTS`, and the new tables use `CREATE TABLE IF NOT EXISTS`.
Apply with the existing init script:

```bash
npm run db:init
```

No data backfill is required:

- `playbook_leads` rows get `status='new'`, `bvi_sync_status='pending'`, etc.
  via the column defaults. Run the cron retry endpoint once to push existing
  rows to BVI in the background.
- `invitation_leads` is new; historical Apply submissions weren't persisted
  locally and cannot be recovered.

## Testing

```bash
npm test          # vitest run
npm run typecheck # tsc --noEmit
```

The test suite covers:

- `lib/bvi-client`: payload mapping, idempotency-key encoding, retry/backoff
  on transient failures, terminal 4xx handling, externalId extraction.
- `lib/leads`: query scoping per lead type, parameterized filters, update
  field whitelisting, soft delete, notes & events JSON serialization.
- `lib/bvi-sync`: end-to-end orchestrator differentiates playbook vs
  invitation when persisting outcomes and recording activity.

## End-to-end manual test

1. Submit the Playbook form on a landing page (e.g. `/cpas`).
   - Confirm the row appears in `/admin/playbook-leads` with
     `bvi_sync_status` flipping `pending` → `synced` within seconds.
   - On BVI's Kanban, the contact appears with
     `Source: FABP playbook lead from cpas landing page.`
2. Submit the Apply form.
   - Confirm an `invitation_leads` row exists.
   - `bd_status` resolves to `created` (or `failed` plus a row in
     `failed_submissions`).
   - The drawer's "Next action" reflects the current step.
   - On BVI, `servicePreference = fabp-invitation` is visible.
3. Force a BVI failure by setting `BVI_API_BASE_URL=http://127.0.0.1:1` and
   resubmitting; the row lands in `bvi_sync_status='failed'` with an error.
   Click "Push to BVI now" in the drawer to retry.
4. Add / edit / delete a note from the drawer; confirm activity log entries.
5. Soft-delete a lead; confirm it disappears from the list and from CSV
   export.
