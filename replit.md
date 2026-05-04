# FABP Invitation App

## Overview
A Next.js application that collects professional membership applications and creates member accounts in Brilliant Directories (BD) via their API.

## Architecture
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: Anthropic SDK (used for AI-assisted features)
- **Validation**: Zod

## Key Files
- `app/api/applications/route.ts` — POST endpoint that receives form submissions and calls `submitApplication`
- `lib/forms.ts` — Core logic: validates BD config, builds the member payload, calls BD API, and sends failure alerts

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

## Failure Alerting
When a Brilliant Directories member creation fails (bad HTTP response, network error, or missing config), the app fires alerts via any configured channels and then returns normally (the applicant always sees the thank-you screen).

**Webhook channel** (`ALERT_WEBHOOK_URL`): Posts a Slack-compatible JSON payload. Works with Slack, Discord, Make, Zapier, or any generic webhook receiver.

**Email channel** (`ALERT_EMAIL` + `RESEND_API_KEY`): Sends an HTML email via [Resend](https://resend.com) to the configured recipient. `ALERT_EMAIL_FROM` should be set to a sender address whose domain is verified in your Resend account — if omitted, the app falls back to `alerts@findabusinesspro.com` and logs a warning at alert-send time that the domain must be Resend-verified or emails will fail to deliver. For new deployments, explicitly setting `ALERT_EMAIL_FROM` is strongly recommended.

Both channels can be configured simultaneously — they fire concurrently.

## Running
- Start: `npm run dev`
- Type check: `npx tsc --noEmit`
