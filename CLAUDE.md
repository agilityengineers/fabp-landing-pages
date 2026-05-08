# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server (Replit workflow runs it on port 5000, host 0.0.0.0)
npm run build    # Production build
npm run start    # Serve the built app
npm run lint     # next lint
```

No test runner is configured.

## What this app is

A per-industry landing-page system for **Find a Business Pro (FABP)**, a B2B directory. Each profession (CPAs, attorneys, fractional CFOs, …) gets its own StoryBrand-style landing page at `/<slug>`. Pages are generated from a JSON config; an admin UI lets a non-technical operator create, edit, and publish industries, with Anthropic's Claude drafting initial copy.

Originated as a Claude Design handoff (`README.md`, `chats/`, `project/`) — those folders are **reference material describing intent**, not part of the running app. `project/FABP Admin Preview.html` is the canonical visual reference for the admin UI; landing-page visuals are described in `chats/chat1.md`.

## Architecture

### Three surfaces, one config store

- **Public landing pages** — `app/[industry]/page.tsx`. Reads `config/industries/<slug>.json` at request time, composes sections from `components/landing/*` based on the `sections` toggle map in the config. `generateStaticParams` pre-renders every slug present on disk; `app/sitemap.ts` only emits **published** industries.
- **Admin UI** — `app/admin/*` plus `components/admin/*`. List, create, edit, publish, delete industry configs. Gated by `middleware.ts`, which checks an `admin-auth` cookie on every `/admin/*` path except `/admin/login`.
- **API routes** — `app/api/*`. Auth (`/auth/login`), CRUD on industries (`/industries`), Claude generation (`/generate`, `/regenerate`), and form intake (`/applications`). All admin-mutating routes re-check the cookie themselves; do not rely on middleware alone.

### Config = source of truth

- `config/schema.ts` defines the **Zod schema** for every industry config. The schema is strict (`.length(4)` villains, `.length(3)` stats and plan steps, FAQ between 4–6) — Claude generations and admin saves are both validated against it. When changing the data shape, update the schema first; everything else flows from it.
- `config/base.json` holds brand-wide info (founder bio, brand name, phone) shared across all industries.
- `lib/config.ts` is the **only** module that touches the filesystem for configs (`loadIndustry`, `listIndustries`, `saveIndustry`, `deleteIndustry`). Routes and pages should go through it.
- **File-based persistence assumes a writable, persistent disk.** Saving an industry writes to `config/industries/<slug>.json`. This works on Replit and any long-running Node host; it will not work on a stateless serverless deployment without changes.

### Claude integration (`lib/claude.ts`)

- Model: `claude-opus-4-7`. API key from `ANTHROPIC_API_KEY`.
- `generateIndustryConfig` few-shots off the `cpas` config and asks Claude for a full JSON industry. Output is stripped of any code fences, JSON-parsed, and validated with `industrySchema.parse`. On validation failure it retries **once** with the error message appended to the prompt.
- `regenerateSection` returns a partial industry for a single section (`hero`, `problem`, `promise`, `plan`, `profile`, `faq`).
- The `SYSTEM_PROMPT` encodes the FABP **brand voice** (premium B2B, no exclamation marks, specific villain/promise framing, fixed problem headline). Treat it as product copy: changes there change every future generation.

### Auth

- `lib/auth.ts` — single shared password (`ADMIN_PASSWORD` env var, default `"admin"` if unset) sets an httpOnly `admin-auth=1` cookie for 7 days. There are no user accounts.
- `middleware.ts` redirects unauthenticated `/admin/*` requests to `/admin/login?from=…`.
- Mutating API routes (`PATCH/POST/DELETE /api/industries`, `/api/generate`, `/api/regenerate`) re-verify the cookie inline.

### Styling

- Tailwind v4 via `@tailwindcss/postcss` (see `postcss.config.mjs`). Most styles live in `app/globals.css` — that file is large and contains the design tokens, accent palette, and component classes the landing components rely on.
- Three Google fonts are wired in `app/layout.tsx` as CSS variables: `--font-newsreader` (serif headlines), `--font-inter-tight` (UI), `--font-jetbrains-mono`.
- The `accent` field on each industry (`navy | midnight | ink | forest`) drives a CSS-variable-based color theme — keep new accents in sync with `globals.css`.

## Conventions worth knowing

- Path alias `@/*` resolves to the repo root (`tsconfig.json`).
- `app/page.tsx` just `redirect("/cpas")` — there is no marketing homepage; every real page lives under an industry slug.
- `lib/forms.ts` `submitApplication` POSTs the applicant to the Brilliant Directories API (`/api/v2/user/create`) to create the member. On any failure it writes a row to the `failed_submissions` table and fires a Slack-compatible alert to `ALERT_WEBHOOK_URL` (caught/logged, never fails the request). Auto-retry runs up to 3 attempts via `lib/retry-scheduler.ts`.
- `next.config.ts` only allowlists `images.unsplash.com` and `www.findabusinesspro.com` for `next/image` — add new remote hosts there.

## Email policy

This app does not send any email directly today. All transactional email (welcome, login credentials, notifications) is sent by Brilliant Directories via the BD API (`send_welcome_email: "1"` / `send_email_notifications: "1"` in `lib/forms.ts`). Operational alerts go to Slack via `ALERT_WEBHOOK_URL` (BD failures) and `PLAYBOOK_SLACK_WEBHOOK_URL` (Provider Playbook leads).

If outbound email is ever added to this codebase, **SendGrid is the chosen provider** — `@sendgrid/mail` is already listed in `package.json` for that future. Do not introduce any other email integration (Resend, Postmark, raw SMTP, etc.). Until that explicit decision is made, `@sendgrid/mail` remains unused and must not be imported.

## Responsive conventions

Mobile-first. Write base styles for the smallest viewport, then layer up with `min-width` queries. The canonical breakpoint scale (matches Tailwind defaults) is declared in `app/globals.css`:

- `sm: 640px` — large phone / very small tablet portrait
- `md: 768px` — tablet portrait
- `lg: 1024px` — tablet landscape / small laptop
- `xl: 1280px` — desktop

Use these breakpoints in any new `@media` rule. Legacy `max-width` queries at 700/800/900/980/1100 are migrating onto this scale section-by-section as components are refactored — don't add new ones at non-standard values.

Fluid spacing tokens (declared in `:root`) replace hand-tuned per-breakpoint padding:

- `--gutter` — horizontal page padding
- `--section-y-sm` / `--section-y-md` / `--section-y-lg` — vertical section padding
- `--stack-gap` — default vertical rhythm inside a stacked section
- `--tap-min: 44px` — minimum tap target on touch surfaces (WCAG 2.5.5)

`next/image` instances must include a `sizes` attribute reflecting the rendered width per breakpoint — otherwise Next ships the largest source on every device. Check `Nav.tsx` / `Sidebar.tsx` for examples.

## Environment variables

See `.env.example`. Required: `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD`. Optional: `NEXT_PUBLIC_SITE_URL` (used by `sitemap.ts` and OG metadata), `ALERT_WEBHOOK_URL` (Slack webhook for BD failure alerts), `PLAYBOOK_SLACK_WEBHOOK_URL` (Slack webhook for Provider Playbook leads).
