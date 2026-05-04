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
| `ALERT_WEBHOOK_URL` | (Optional) Webhook URL for admin failure alerts (Slack, Discord, Make, Zapier, etc.) |
| `SESSION_SECRET` | Session signing secret |

## Failure Alerting
When a Brilliant Directories member creation fails (bad HTTP response, network error, or missing config), the app sends an alert to `ALERT_WEBHOOK_URL` if that secret is set. The payload is Slack-compatible (with fallback `text` field) and works with any generic webhook. The applicant sees the thank-you screen regardless.

## Running
- Start: `npm run dev`
- Type check: `npx tsc --noEmit`
