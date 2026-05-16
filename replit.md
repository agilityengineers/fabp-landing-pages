# FABP Invitation App

## Overview
A Next.js application that collects professional membership applications and creates member accounts in Brilliant Directories (BD) via their API. All member-facing emails (welcome, password setup, login credentials) are sent by Brilliant Directories directly — this app sends no emails to applicants or members.

## Architecture
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Replit PostgreSQL (via `pg` package)

## Key Files
- `app/api/applications/route.ts` — POST endpoint that receives form submissions and calls `submitApplication`
- `lib/forms.ts` — Core logic: validates BD config, builds the member payload, calls BD API, logs failures to DB, sends failure alerts via webhook
- `lib/db.ts` — Shared PostgreSQL connection pool
- `lib/retry-scheduler.ts` — Auto-retry logic for failed submissions (up to 3 attempts)
- `lib/retry-config.ts` — Shared `MAX_AUTO_RETRIES` constant
- `lib/config.ts` — Loads industry config from `config/industries/<slug>.json`
- `app/api/admin/failed-submissions/route.ts` — Admin API to list, retry, or dismiss failed submissions
- `app/api/cron/retry-submissions/route.ts` — HTTP cron endpoint for external schedulers
- `instrumentation.ts` — Next.js server startup hook; runs DB schema and optionally starts in-process retry scheduler

## Industry Pages
Industry pages are configured via JSON files in `config/industries/<slug>.json`. Each file must include a `professionId` field matching the numeric BD category ID. No code changes are needed to add a new industry page — just add a config file. Run `npm run validate:configs` to check all configs before deploying.

## Database
- **Connection pool** (`lib/db.ts`): `max=10`, `idleTimeoutMillis=30s`, `connectionTimeoutMillis=10s`. Override with `PG_POOL_MAX`, `PG_POOL_IDLE_TIMEOUT_MS`, `PG_POOL_CONNECTION_TIMEOUT_MS`. A slow query can no longer starve the pool indefinitely — a handshake hang fails the request in ≤10s instead of hanging forever.
- **Table**: `failed_submissions` — stores every failed BD API call with full applicant data, error details, status (`pending`/`processing`/`resolved`/`dismissed`), and retry count.
- **Admin API**:
  - `GET /api/admin/failed-submissions` — list all failed submissions (optional `?status=` filter)
  - `POST /api/admin/failed-submissions` `{ id, action: "retry" | "dismiss" }` — retry or dismiss a pending submission

## Brilliant Directories API
- **Endpoint**: `POST https://www.findabusinesspro.com/api/v2/user/create`
- **Auth**: `X-Api-Key` header
- **Content-Type**: `application/x-www-form-urlencoded`
- **Key fields**: `subscription_id` (hardcoded `"21"`), `profession_id`, `member_type` (`"Service Provider"`), `send_welcome_email: "1"`, `send_email_notifications: "1"`
- BD sends all member-facing emails (welcome, login credentials) directly via its own system

## Environment Variables / Secrets
| Variable | Description |
|---|---|
| `BD_API_KEY` | Brilliant Directories API key — sent as `X-Api-Key` header |
| `ALERT_WEBHOOK_URL` | (Optional) Slack incoming webhook URL for BD member-creation failure alerts. Slack is the only supported alert channel — this app does not send any email of its own |
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit) |
| `ENABLE_BACKGROUND_RETRY` | Set to `true` to run the auto-retry scheduler in-process (dev/Replit). Leave unset in production and use the HTTP cron endpoint instead |
| `CRON_SECRET` | Bearer token required by **both** cron endpoints (`/api/cron/retry-submissions` and `/api/cron/sync-bvi`). When unset, both endpoints return 503 and refuse to run — there is no admin-cookie fallback |
| `ADMIN_PASSWORD` | Login password for the admin dashboard. **Required in production** — the app refuses to authenticate if unset in production |
| `ADMIN_SESSION_SECRET` | (Optional, recommended) HMAC key used to sign the admin session cookie. Defaults to `ADMIN_PASSWORD` when unset. Generate with `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | (Optional) Comma-separated extra origins (full URLs) allowed for state-changing admin requests, in addition to the request's own Host. Useful when the app is reached through multiple domains |
| `PG_POOL_MAX` | (Optional) Maximum number of PG client connections held by the pool. Default `10`. Raise only after measuring DB-side connection headroom |
| `PG_POOL_IDLE_TIMEOUT_MS` | (Optional) ms an idle pool connection lives before being recycled. Default `30000` |
| `PG_POOL_CONNECTION_TIMEOUT_MS` | (Optional) ms to wait for a new PG connection before throwing. Default `10000` |
| `PLAYBOOK_PRESIGN_TTL_SECONDS` | (Optional) TTL for the S3 presigned URL handed back to playbook leads and admins. Default `3600` (1 hour). Clamped to `[60, 21600]` |

## Authentication & CSRF
- Admin auth uses an **HMAC-signed, opaque session cookie** (`admin-auth=<issuedAt>.<sha256-hmac>`). Setting `admin-auth=1` manually no longer grants access — the value is verified against the session secret on every request, including in the Edge middleware that protects `/admin/*` and `/preview/*`.
- The cookie is `HttpOnly`, `SameSite=Strict`, and `Secure` in production. SameSite=Strict is the primary CSRF defense.
- Login compares the password with `crypto.timingSafeEqual` (constant time) and refuses to authenticate at all when `ADMIN_PASSWORD` is missing in production.
- All state-changing admin/public API routes also run a defense-in-depth `requireSameOrigin` check (Origin/Referer must match the request Host, or any extra entry in `ALLOWED_ORIGINS`).
- Cron endpoints (`/api/cron/*`) are bearer-only — `x-cron-secret: <CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`. They cannot be triggered with the admin cookie. For ad-hoc human-initiated runs, use the per-row admin endpoints (e.g. `/api/admin/leads/[type]/[id]/sync-bvi`).
- `/api/auth/login` is rate-limited (10/min/IP) to slow brute-force guessing.

## Rate Limiting
Public POST endpoints have per-IP token-bucket throttling (`lib/rate-limit.ts`):
- `/api/applications`: 5/min/IP
- `/api/playbook-leads`: 5/min/IP (in addition to Cloudflare Turnstile)
- `/api/playbook-generate`: 5/min/IP (caps Anthropic + Puppeteer cost)
- `/api/auth/login`: 10/min/IP

The buckets are **in-process**. On Replit autoscale (multiple Node instances) the effective limit is `limit × instanceCount` — still enough to stop loops and single-IP bursts, but not a substitute for an upstream WAF if you face determined abuse. Swap `lib/rate-limit.ts` for a DB/Redis-backed implementation if you need a global counter.

## Input Validation & Payload Size
Public POST endpoints validate the request body with a strict `zod` schema and enforce a 32 KB `Content-Length` cap. Malformed or oversized bodies return 400/413 with a safe error message.

## Observability & Health
- `GET /api/health` (admin-only — returns 401 without the admin session cookie) reports DB connectivity, pool stats (`total`/`idle`/`waiting`/`max`), and counts of `failed_submissions` and `playbook_jobs` by status. Returns 503 if the DB ping fails. Use it as the single dashboard query for "what's stuck right now".
- BD request/response bodies are **never** logged to stdout in full. `lib/forms.ts` logs only `HTTP status` + redacted summary (`<bd response: user_id=…, NB>`); the full error body is persisted to `failed_submissions.error_detail` where it stays inside the database, not the deployment log aggregator.
- Submission entry log carries no PII — only `profession`, `city`, `state`, `industrySlug`, `variant`, `submittedAt`. Look up `invitation_leads` by id for the rest.

## Submission Idempotency
`submitApplication` (`lib/forms.ts`) checks `invitation_leads` for any `bd_status='created'` row with the **same lowercased email** in the last **10 minutes** before POSTing to BD. If found, the second submit is a no-op: the new `invitation_leads` row inherits the prior `bd_user_id`, a `bd_skipped_duplicate` event is recorded, and BD is not called again — so a user who double-clicks Submit, an auto-retrying browser, or two tabs open at once cannot end up with two BD accounts (and two different welcome emails with different temp passwords).

## Failure Alerting & Recovery
When a BD member creation fails, the app:
1. Writes the full applicant data + error detail to the `failed_submissions` table
2. POSTs a Slack-formatted JSON alert to `ALERT_WEBHOOK_URL` (Slack is the only supported alert channel) if configured

Admins can retry failed submissions via the admin dashboard (`/admin/applications`) or the cron endpoint. Successful retries mark the row as `resolved`.

The auto-retry scheduler runs up to 3 attempts per failed submission. When all attempts are exhausted, a final webhook alert fires so admins know manual action is needed.

## Provider Playbook Generation (PR #28)
The `/admin/...` PlaybookPanel can generate a per-industry PDF via Anthropic + Puppeteer. Pipeline:
1. Admin clicks Generate → `POST /api/playbook-generate` inserts a `playbook_jobs` row (`status='running'`) and returns 202 + `jobId`.
2. In-process `runJob()` calls Anthropic (model from `ANTHROPIC_MODEL`, default `claude-opus-4-5`), renders the HTML template to PDF via Puppeteer, uploads to `s3://<bucket>/<prefix>/playbooks/drafts/<slug>-<jobId>.pdf`, marks the row `ready`.
3. Admin polls `/api/playbook-jobs/[id]`, reviews the presigned draft, then `POST .../publish` copies the draft to a versioned key and writes the reference back into the industry config (`source: "generated"`).

### Operational invariants (DO NOT BREAK)
- **Single-worker model.** `runJob` is strictly in-process. The startup reaper in `instrumentation.ts` marks **every** `status='running'` row as `failed` at boot, with no age threshold, on the assumption that any row still `running` after a restart is necessarily orphaned. This is only safe because the deployment is a **single reserved-VM instance** (see [Deployment](#deployment) below). **If you ever switch the deployment to `autoscale`, this reaper must be replaced with a heartbeat / worker-id check or a freshly booting instance will kill jobs another instance is actively running.**
- **Status-guarded UPDATEs.** Both terminal-state transitions in `app/api/playbook-generate/route.ts` use `WHERE id=$ AND status='running'` to prevent a late-completing worker from overwriting a row the watchdog already marked `failed`. Don't remove the guard.
- **Hard timeout.** A 5-minute wall-clock ceiling wraps `runJob` so a wedged Anthropic/Puppeteer call cannot leave a row in `running` forever.

### Required env vars (in addition to the table below)
`ANTHROPIC_API_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_S3_PREFIX` (optional), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. After deploying for the first time, run `npx tsx scripts/upload-default-playbook.ts <pdf>` to seed the fallback PDF at `<prefix>/playbooks/_default.pdf` — the form returns "playbook hasn't been uploaded yet" until that file exists.

## Deployment
- **Target:** reserved-VM, **single instance** (`.replit` -> `[deployment] deploymentTarget = "vm"`). Do NOT change to `autoscale` without first replacing the playbook-jobs startup reaper with a heartbeat/worker-id check, and migrating the in-memory rate-limit buckets and the in-process retry single-flight guard to a shared store (DB/Redis).
- **Chromium for Puppeteer:** the `chromium` nix package is provisioned via `replit.nix` (`pkgs.chromium`). Puppeteer's own bundled Chromium cannot launch on Replit's NixOS containers, so `lib/pdf.ts` launches the system Chromium via `executablePath` (resolved from `PUPPETEER_EXECUTABLE_PATH` or the `chromium` binary on PATH). To pin a specific binary in the deploy, set `PUPPETEER_EXECUTABLE_PATH` in the deployment Secrets.
- **Retry scheduler in production:** leave `ENABLE_BACKGROUND_RETRY` unset and use the HTTP cron path (`POST /api/cron/retry-submissions` with `Authorization: Bearer $CRON_SECRET` or `x-cron-secret: $CRON_SECRET`). Setting both at once causes double-processing — `instrumentation.ts` logs a WARNING if it sees `ENABLE_BACKGROUND_RETRY=true` in production.
- **Startup secret check:** in production (`NODE_ENV=production`), `instrumentation.ts` logs a loud `[startup] FATAL` line listing any missing required secrets (BD_API_KEY, DATABASE_URL, ADMIN_PASSWORD, CRON_SECRET, ANTHROPIC_API_KEY, AWS_*) and a `[startup] WARNING` for missing recommended ones. The server still boots so it can serve a status page, but the related features will fail until the secrets are set.

## Running
- Start: `npm run dev`
- Type check: `npx tsc --noEmit`
- Validate industry configs: `npm run validate:configs`
- Init DB schema manually: `npm run db:init`
