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
| `ALERT_WEBHOOK_URL` | (Optional) Webhook URL for failure alerts — Slack, Discord, Make, Zapier, or any Slack-compatible webhook receiver |
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit) |
| `ENABLE_BACKGROUND_RETRY` | Set to `true` to run the auto-retry scheduler in-process (dev/Replit). Leave unset in production and use the HTTP cron endpoint instead |
| `CRON_SECRET` | Bearer token required to call `GET /api/cron/retry-submissions` |

## Failure Alerting & Recovery
When a BD member creation fails, the app:
1. Writes the full applicant data + error detail to the `failed_submissions` table
2. POSTs a Slack-compatible JSON alert to `ALERT_WEBHOOK_URL` if configured

Admins can retry failed submissions via the admin dashboard (`/admin/applications`) or the cron endpoint. Successful retries mark the row as `resolved`.

The auto-retry scheduler runs up to 3 attempts per failed submission. When all attempts are exhausted, a final webhook alert fires so admins know manual action is needed.

## Running
- Start: `npm run dev`
- Type check: `npx tsc --noEmit`
- Validate industry configs: `npm run validate:configs`
- Init DB schema manually: `npm run db:init`
