# Find a Business Pro — Landing Pages + Admin

Next.js 15 (App Router) app for Find a Business Pro. Public landing pages per industry, plus an admin panel that uses Anthropic Claude to draft new industry configs.

## Stack
- Next.js 15.5 (App Router) + React 18 + TypeScript
- Tailwind CSS v4 (PostCSS plugin)
- Anthropic SDK for AI generation
- Zod for config validation
- Storage: industry configs as JSON files in `config/industries/`

## Layout
- `app/` — App Router routes
  - `app/page.tsx` — root landing
  - `app/[industry]/page.tsx` — per-industry landing
  - `app/admin/*` — gated admin UI
  - `app/api/*` — applications, auth, generate, regenerate, industries
- `components/landing/*`, `components/admin/*` — UI
- `config/` — base config, JSON schema, per-industry JSON
- `lib/` — auth, claude client, config loader
- `middleware.ts` — gates `/admin/*` via `admin-auth` cookie

## Environment
Secrets (set in Replit Secrets):
- `ANTHROPIC_API_KEY` — required for admin AI generation
- `ADMIN_PASSWORD` — required for admin login

Env vars (shared):
- `NEXT_PUBLIC_SITE_URL` — site URL for sitemap/OG tags

## Replit setup
- Workflow `Start application`: `npm run dev -- -p 5000 -H 0.0.0.0` on port 5000 (webview)
- `next.config.ts` sets `allowedDevOrigins: ["*"]` so the Replit iframe proxy is trusted in dev
- Deployment: autoscale, build `npm run build`, run `npm run start -- -p 5000 -H 0.0.0.0`
