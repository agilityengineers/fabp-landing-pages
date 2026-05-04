# FABP Invitation App

## Overview
A Next.js application that collects professional membership applications and creates member accounts in Brilliant Directories (BD) via their API.

## Architecture
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: Anthropic SDK (used for AI-assisted features)
- **Validation**: Zod
- **Database**: Replit PostgreSQL (via `pg` package)

## Key Files
- `app/api/applications/route.ts` — POST endpoint that receives form submissions and calls `submitApplication`
- `lib/forms.ts` — Core logic: validates BD config, builds the member payload, calls BD API, logs failures to DB, and sends failure alerts
- `lib/db.ts` — Shared PostgreSQL connection pool
- `app/api/admin/failed-submissions/route.ts` — Admin API to list, retry, or dismiss failed submissions

## Database
- **Table**: `failed_submissions` — stores every failed BD API call with full applicant data, error details, status (`pending`/`resolved`/`dismissed`), and retry count.
- **Admin API**:
  - `GET /api/admin/failed-submissions` — list all failed submissions (requires admin auth)
  - `POST /api/admin/failed-submissions` `{ id, action: "retry" | "dismiss" }` — retry (marks `resolved` on success) or dismiss a pending submission

## Environment Variables / Secrets
| Variable | Description |
|---|---|
| `BD_API_KEY` | Brilliant Directories API key |
| `BD_API_URL` | Brilliant Directories base API URL |
| `SESSION_SECRET` | Session signing secret |
| `ALERT_WEBHOOK_URL` | (Optional) Webhook URL for failure alerts (Slack, Discord, Make, Zapier, etc.) |
| `ALERT_EMAIL` | (Optional) Recipient email address for failure alert emails |
| `RESEND_API_KEY` | Required when `ALERT_EMAIL` is set — Resend API key for sending alert emails |
| `ALERT_EMAIL_FROM` | (Optional) Sender address for alert emails; must be a Resend-verified domain. Defaults to `alerts@findabusinesspro.com` |
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit) |

## Failure Alerting & Recovery
When a Brilliant Directories member creation fails (bad HTTP response, network error, or missing config), the app:
1. Writes the full applicant data + error detail to the `failed_submissions` table in the database
2. Fires alerts via any configured channels (applicant always sees the thank-you screen)

**Webhook channel** (`ALERT_WEBHOOK_URL`): Posts a Slack-compatible JSON payload. Works with Slack, Discord, Make, Zapier, or any generic webhook receiver.

**Email channel** (`ALERT_EMAIL` + `RESEND_API_KEY`): Sends an HTML email via [Resend](https://resend.com) to the configured recipient. `ALERT_EMAIL_FROM` should be set to a Resend-verified sender domain (defaults to `alerts@findabusinesspro.com` with a warning if unset).

Both channels can be configured simultaneously — they fire concurrently. Admins can retry failed submissions via the admin API; successful retries automatically mark the row as `resolved`.

## Running
- Start: `npm run dev`
- Type check: `npx tsc --noEmit`
