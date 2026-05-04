# Find a Business Pro — Invitation Landing Page
## Master Prompt for Claude Code on Replit

You are building **`invitation.findabusinesspro.com`**, a Next.js 15 (App Router) master landing-page template that recruits service providers to join Find a Business Pro. The page is StoryBrand-structured, premium B2B in aesthetic, and **ships with an admin UI that lets a non-technical admin spin up a new industry page by typing the industry name and letting Anthropic's API generate the content**. Structure is fixed; only content varies per industry.

---

## 0. PROJECT GOAL

- Single Next.js 15 codebase deployed at `invitation.findabusinesspro.com`.
- Public routes: `/[industry]` (e.g. `/cpas`, `/attorneys`, `/fractional-cfos`). Each is a static-rendered landing page generated from a per-industry JSON config.
- Admin route: `/admin` (password-protected). Admin can:
  - **Create a new industry by typing its name** → Anthropic API drafts all content into the canonical schema → admin reviews/edits/publishes.
  - **Edit any existing industry** through a form.
  - **Toggle sections, founder block, and accent** per industry.
  - **Publish / unpublish** pages.
- Adding a new industry = typing the name into the admin and clicking publish. **No file editing. No code changes. No redeploy.**

---

## 1. CANONICAL TEMPLATE (DO NOT VARY)

Every industry page renders exactly this structure, in this order. Per-industry JSON only varies the *content* inside this structure — never the layout, never the section order, never the visual system.

| # | Section ID | Purpose | StoryBrand role |
|---|---|---|---|
| 1 | `hero` | Eyebrow, headline (with one italicized phrase), subhead, primary + secondary CTA, layered hero photo + floating sample-listing card, 3 trust meta items | Character + problem |
| 2 | `problemPromise` | Dark band. Left: "You didn't earn the credentials to become a marketer" + 4 numbered villain rows. Right: a "Promise" card with success-vision headline + 3 stat cells | Villain + stakes + success vision |
| 3 | `plan` | Light band. Section head + lead paragraph (references *Marketing Mayhem*). 3 numbered horizontal steps in a card grid: Apply → Brand Voice Interview → Get listed & matched | Plan |
| 4 | `apply` | Light gradient band. Left column: final CTA copy + 4-question FAQ accordion + "Browse the directory" fallback link. Right column: 2-step progressive application form (5 fields → 4 fields), thank-you state | Direct CTA + objection handling |
| — | `footer` | Always rendered. Lean: ©, link to `findabusinesspro.com`, subdomain stamp | — |

The nav bar sits above. It contains: logo (left), "Visit the directory →" link (right), primary CTA button (right). **The industry-switcher dropdown that exists in the design prototype is a design-time tool — DO NOT ship it to production.** Each industry is its own URL.

---

## 2. TECH STACK

- **Next.js 15** (App Router, TypeScript, React 18)
- **Tailwind CSS v4** with custom design tokens
- **`next/font`** for self-hosted fonts: Newsreader (serif), Inter Tight (sans), JetBrains Mono (mono)
- **Zod** for schema validation (industry config schema)
- **shadcn/ui** for: Accordion, Form primitives. Hand-roll everything else.
- **Anthropic SDK** (`@anthropic-ai/sdk`) for the admin AI generator
- **bcryptjs** + **iron-session** (or Replit's auth, whichever Claude Code recommends as cleanest) for admin auth
- **No CMS, no database for v1.** Industry configs stored as JSON files in `data/industries/*.json`. Admin form writes to those files via a server action. Designed so the storage layer can swap to Postgres/Sanity later without changing the admin UX.

---

## 3. FILE STRUCTURE

```
app/
  layout.tsx                    # root, fonts, metadata defaults
  page.tsx                      # marketing homepage redirect → first published industry
  [industry]/
    page.tsx                    # public landing page (static-generated)
    not-found.tsx
  admin/
    layout.tsx                  # auth gate
    page.tsx                    # industry list + "Create new" button
    new/
      page.tsx                  # AI generator step + form
    [industry]/
      page.tsx                  # edit existing industry
    login/
      page.tsx
    actions.ts                  # server actions: generate, save, publish, unpublish, delete
  api/
    generate/route.ts           # POST → Anthropic API → returns drafted JSON
  globals.css                   # tokens + Tailwind layers
components/
  landing/
    Nav.tsx
    Hero.tsx
    ProblemPromise.tsx
    Plan.tsx
    Apply.tsx
    Footer.tsx
    ui/Eyebrow.tsx
    ui/Reveal.tsx
    ui/Button.tsx
  admin/
    IndustryList.tsx
    IndustryForm.tsx
    GeneratorStep.tsx
    SectionToggles.tsx
    AccentPicker.tsx
data/
  industries/
    cpas.json
    attorneys.json
    fractional-cfos.json
    business-coaches.json
    ma-advisors.json
    agile-consulting.json
    marketing-agencies.json
    exit-planning.json
  base.json                     # brand constants, founder bio, parent URL
lib/
  schema.ts                     # Zod schema for industry config + base config
  industries.ts                 # listIndustries(), loadIndustry(slug), saveIndustry(), publishIndustry()
  forms.ts                      # submitApplication() — INTEGRATION POINT for form destination
  anthropic.ts                  # Anthropic client + generateIndustryContent() function
  prompts.ts                    # the AI prompt template (see Section 8)
  auth.ts                       # admin session helpers
public/
  fabp-logo.png
  provider-playbook.pdf         # PLACEHOLDER — replace with real PDF
  industries/
    cpas.jpg                    # hero photo per industry
    attorneys.jpg
    ...
```

---

## 4. DESIGN SYSTEM (LOCKED)

These tokens go into `app/globals.css` as CSS custom properties and are referenced everywhere. Do not introduce ad-hoc colors, font sizes, or shadows.

### Colors — parent brand, elevated

```css
:root {
  /* Brand blues — parent identity */
  --blue-900: #0b2a47;   /* accent-deep, primary CTA bg */
  --blue-800: #0f3458;
  --blue-700: #1f5181;   /* parent primary */
  --blue-600: #2d6aa3;
  --blue-100: #dbe6f3;
  --blue-50:  #eef3f9;

  /* Brand greens — parent secondary, success */
  --green-700: #3f6b1d;
  --green-600: #548c29;  /* parent green */
  --green-500: #6da537;

  /* Warm ink scale */
  --ink-900: #0e0d0b;
  --ink-800: #1c1b18;
  --ink-700: #34322e;
  --ink-500: #6c6862;
  --ink-400: #8b8780;
  --ink-300: #b6b1a8;
  --ink-200: #d9d4ca;
  --ink-100: oklch(95% 0.005 70);
  --ink-50:  oklch(98% 0.005 70);

  /* Surfaces — warm off-white (NOT pure white) */
  --paper:   oklch(98% 0.006 75);
  --paper-2: oklch(96% 0.008 75);
  --rule:    oklch(85% 0.005 75);

  --accent: var(--blue-700);
  --accent-deep: var(--blue-900);
}
```

### Typography

- **Headlines:** Newsreader (serif), `letter-spacing: -0.014em`, line-height 1.05–1.1
- **Body:** Inter Tight, 16px / 1.55
- **Eyebrows + UI labels:** JetBrains Mono, 11px, uppercase, letter-spacing 0.06–0.16em
- **One h1 per page**, fluid: `clamp(40px, 5.5vw, 76px)`
- Italic phrases inside headlines use `<em>` colored `var(--accent-deep)` — this is the signature gesture.

### Spacing & shape

- Container max-width 1240px, side padding 32px (22px on mobile)
- Section padding 32–56px (tight rhythm — do NOT inflate to 100px+)
- Radii: sm 6px, md 12px, lg 20px
- 0.5px hairlines (`var(--rule)`) instead of 1px borders
- 3-tier shadow scale, brand-tinted (rgba 11,42,71)

### Motion

- IntersectionObserver-based reveal: opacity 0→1, translateY 14→0, 700ms cubic-bezier(.2,.7,.2,1)
- Buttons: hover translateY -1px, arrow-icon translateX 3px on hover
- FAQ: grid-template-rows transition for smooth open/close
- Respect `prefers-reduced-motion`

### Header

- Logo image: `public/fabp-logo.png` at height 102px desktop / 76px mobile
- Sticky, blurred-glass background (`oklch(98% 0.006 75 / 0.82)` + `backdrop-filter: blur(16px)`)
- 0.5px bottom border appears only after scroll

---

## 5. INDUSTRY SCHEMA (Zod, in `lib/schema.ts`)

This is the single source of truth. Both the public page and the admin form derive from this. The AI generator's output is validated against this. **Every field is required** unless marked optional — the schema enforces it.

```ts
import { z } from "zod";

export const industrySchema = z.object({
  // Identifiers
  slug: z.string().regex(/^[a-z0-9-]+$/),     // url segment
  industry: z.string().min(2),                 // display name plural ("CPAs")
  industryShort: z.string().min(2),            // singular ("CPA")
  published: z.boolean().default(false),

  // SEO
  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string().optional(),
  }),

  // Section 1 — Hero
  hero: z.object({
    eyebrow: z.string(),                       // "An Invitation — for CPAs"
    headline: z.string(),                      // contains <em>...</em> for italic phrase
    subhead: z.string(),
    primaryCta: z.string().default("Book a 15-min intro call"),
    secondaryCta: z.string().default("Provider Playbook"),
    heroImage: z.string(),                     // /industries/cpas.jpg
    heroPhotoLabel: z.string(),                // "CPA · CHARLOTTE, NC"
  }),

  // Section 2 — Problem → Promise
  problem: z.object({
    headline: z.string().default("You didn't earn the credentials to become a marketer."),
    villains: z.array(z.object({
      t: z.string(),                           // title
      b: z.string(),                           // body
    })).length(4),
  }),
  promise: z.object({
    headline: z.string(),                      // success vision, 90-day arc
    stats: z.array(z.object({
      v: z.string(),                           // value, e.g. "$8.4k"
      l: z.string(),                           // label, e.g. "Avg. CPA engagement value"
    })).length(3),
  }),

  // Section 3 — Plan (always 3 steps; copy stays consistent across industries)
  plan: z.array(z.object({
    time: z.string(),                          // "Step 01"
    title: z.string(),                         // "Apply"
    body: z.string(),
  })).length(3),

  // Section 4 — Apply
  profile: z.object({                          // floating "Listed" sample card in hero
    name: z.string(),
    role: z.string(),
    city: z.string(),
    stats: z.array(z.object({
      v: z.string(),
      l: z.string(),
    })).length(3),
  }),
  faq: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).length(4),

  // Per-industry toggles
  sections: z.object({
    hero: z.boolean().default(true),
    problemPromise: z.boolean().default(true),
    plan: z.boolean().default(true),
    apply: z.boolean().default(true),
  }),
  showFounder: z.boolean().default(false),     // founder photo+bio in apply column when true
  accentHueShift: z.number().min(-30).max(30).default(0),  // optional oklch hue shift
});

export type Industry = z.infer<typeof industrySchema>;

export const baseSchema = z.object({
  brand: z.object({
    name: z.string(),
    parentUrl: z.string().url(),
    phone: z.string(),
    logoUrl: z.string(),
  }),
  founder: z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    photo: z.string().optional(),
  }),
});
```

---

## 6. SEED DATA (8 INDUSTRIES — DO NOT REGENERATE; PORT EXACTLY)

Use the existing `configs.jsx` from the design prototype as the literal seed for these 8 JSON files. Slugs:

```
cpas, attorneys, fractional-cfos, business-coaches,
ma-advisors, agile-consulting, marketing-agencies, exit-planning
```

Each ships with `published: true`, `sections: { hero: true, problemPromise: true, plan: true, apply: true }`, `showFounder: false`, `accentHueShift: 0`. Hero images go in `public/industries/`.

---

## 7. ADMIN UI

### 7.1 Auth

- `/admin/login` — single-password gate, password stored in env var `ADMIN_PASSWORD` (hashed with bcrypt at startup, compared on submit). `iron-session` cookie.
- All `/admin/*` routes check the cookie via middleware. Unauthenticated → redirect to login.

### 7.2 Industry list (`/admin`)

- Table of all industries with columns: name, slug, status (published/draft), last edited, actions (Edit / View public page / Unpublish / Delete).
- Top-right: prominent **"+ New industry"** button → `/admin/new`.

### 7.3 Create new (`/admin/new`)

A two-step flow:

**Step 1 — Generate**
- Single text input: "Industry name" (e.g. "Commercial Real Estate Brokers")
- Optional textarea: "Anything specific to mention?" (target metro, deal size, niche, pricing band, etc.)
- Optional fields: industryShort override, slug override (auto-generated from name)
- Button: **"Generate draft with AI"**
- Submitting POSTs to `/api/generate` — server calls Anthropic API with the prompt template from `lib/prompts.ts`, returns drafted content matching the schema. Response is shown in Step 2.

**Step 2 — Review & edit**
- Renders the same form as the edit screen (Section 7.4), pre-filled with AI output.
- Admin can edit any field, toggle sections, choose "Save as draft" or "Publish."

### 7.4 Edit industry (`/admin/[industry]`)

A long form, grouped by section, mirroring the schema 1:1. Each schema field becomes a labeled input or textarea. Required fields validated client-side via Zod. Buttons: **Save draft**, **Preview** (opens public page in new tab), **Publish/Unpublish**, **Delete**.

Includes:
- Section toggle switches (4 booleans)
- Founder toggle
- Accent hue shift slider (−30 to +30)
- Hero image upload (writes to `public/industries/[slug].jpg`)
- "Regenerate with AI" button on each section (re-runs Anthropic for that section only)

### 7.5 Server actions (`app/admin/actions.ts`)

```ts
"use server";
export async function generateDraft(input: { industry: string; notes?: string }): Promise<Industry>;
export async function saveIndustry(slug: string, data: Industry): Promise<void>;
export async function publishIndustry(slug: string): Promise<void>;
export async function unpublishIndustry(slug: string): Promise<void>;
export async function deleteIndustry(slug: string): Promise<void>;
```

All write to `data/industries/[slug].json`. Validated with Zod before write. After write, the page revalidates via `revalidatePath('/[industry]')`.

---

## 8. AI GENERATOR (Anthropic)

### 8.1 Client (`lib/anthropic.ts`)

```ts
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateIndustryContent(industry: string, notes?: string): Promise<Industry> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(industry, notes) }],
  });
  // extract JSON from response, validate against industrySchema, return
}
```

### 8.2 Prompt template (`lib/prompts.ts`)

The system prompt instructs the model:

- You are writing copy for a Find a Business Pro invitation landing page.
- Voice: premium B2B, StoryBrand framework (the professional is the Hero, FABP is the Guide).
- Tone: warm-professional, confident, never salesy.
- Reference the *Marketing Mayhem* book and the chaos→clarity 90-day arc once in the success vision.
- Return ONLY valid JSON matching this schema: [paste industrySchema fields].
- Required content rules:
  - **Headline** must include exactly one `<em>...</em>` italicized phrase, max 12 words total.
  - **4 villains, fixed pattern:** (1) wasted ad spend / channel mismatch, (2) invisibility in crowded market, (3) race-to-the-bottom marketplaces, (4) low-intent referrals or leads that ghost. Each title 3–6 words; body 12–20 words.
  - **Promise headline** evokes 90-day chaos→clarity transformation.
  - **3 promise stats:** $-value of avg engagement, exclusivity scope (e.g. "1 per metro"), "90 days" to first inbound.
  - **Plan** is fixed across industries (Apply / Brand Voice Interview / Get listed) — keep these exact step titles; only adjust body copy if industry-specific.
  - **Sample profile:** plausible name + credentials, role, U.S. city, 3 stats (years in practice, a credential or volume metric, an active-clients count).
  - **4 FAQs:** cost, category exclusivity, traffic quality, what-happens-after-applying.
  - **Hero photo label:** uppercase mono format `"PROFESSION · CITY, ST"`.
- The user prompt provides: `{industry}` (e.g. "M&A Advisors") and optional `{notes}`.

The JSON output is parsed, run through `industrySchema.parse()`, and returned. If validation fails, return the parse error to the admin UI for retry.

### 8.3 Per-section regeneration

Each section's "Regenerate" button hits the same endpoint with a `section` parameter; the prompt narrows to just that section's fields and merges the result into the existing draft.

---

## 9. PUBLIC LANDING PAGE BUILD

### 9.1 Routing

```ts
// app/[industry]/page.tsx
export async function generateStaticParams() {
  return listIndustries({ publishedOnly: true }).map(i => ({ industry: i.slug }));
}

export async function generateMetadata({ params }) {
  const i = await loadIndustry(params.industry);
  return { title: i.seo.title, description: i.seo.description, /* og */ };
}

export default async function Page({ params }) {
  const cfg = await loadIndustry(params.industry);
  if (!cfg) notFound();
  return <LandingPage cfg={cfg} base={await loadBase()} />;
}
```

`LandingPage` renders Nav + each gated section + Footer per the canonical template.

### 9.2 Form submission

`lib/forms.ts`:

```ts
export type ApplicationData = {
  name: string; email: string; phone?: string;
  profession: string; city: string;
  years?: string; website?: string; spend?: string; fit?: string;
  industrySlug: string; submittedAt: string;
};

export async function submitApplication(data: ApplicationData) {
  // INTEGRATION POINT — wire to Resend / HubSpot / GoHighLevel / Calendly
  // For now: POST to /api/applications which logs and returns 200
  // Leave a clean swap point — admin will configure later
}
```

The form itself is the existing 2-step progressive form from the prototype. Step 1: name, email, phone, profession (defaults to industry), city. Step 2: years in practice, website/LinkedIn, monthly marketing spend (select), fit short-answer.

### 9.3 SEO

- Per-page `<title>` and `<meta description>` from `seo` block
- Open Graph tags
- JSON-LD `Organization` + `Service` schema injected
- `app/sitemap.ts` auto-generates from published industries
- `robots.txt` allows indexing

---

## 10. ENV & DEPLOYMENT (Replit)

### 10.1 Env vars

```
ANTHROPIC_API_KEY=<from console.anthropic.com>
ADMIN_PASSWORD=<single password for /admin>
SESSION_SECRET=<32+ random chars>
NEXT_PUBLIC_SITE_URL=https://invitation.findabusinesspro.com
NEXT_PUBLIC_PARENT_URL=https://www.findabusinesspro.com
```

### 10.2 Replit config

- `replit.nix` pinning Node 20 + pnpm
- `.replit` run command: `pnpm install && pnpm build && pnpm start`
- Replit Secrets pane stores all env vars

### 10.3 Subdomain DNS

- In domain registrar (or Cloudflare): CNAME `invitation` → Replit deployment URL
- SSL: Full
- Replit deployment domain added in project settings

---

## 11. ACCEPTANCE CRITERIA

- [ ] All 8 seed industries render statically at their slugs (`/cpas`, `/attorneys`, etc.)
- [ ] Visiting `/admin` requires login; correct password lands on industry list
- [ ] **Adding a new industry = typing its name in `/admin/new`, clicking generate, reviewing the draft, clicking publish.** No file edits, no redeploy.
- [ ] AI-generated content is validated against `industrySchema` before being saved; validation errors are shown inline in the admin UI for fix-up
- [ ] Each `sections.<name>` toggle hides/shows that section on the public page
- [ ] `showFounder` toggle swaps the founder block in/out of the apply column without layout break
- [ ] Hero, problem→promise, plan, and apply are responsive at 360px / 768px / 1280px
- [ ] Lighthouse: ≥95 Performance, ≥95 Accessibility, ≥95 SEO on `/cpas`
- [ ] Form submits to `submitApplication()` and shows the thank-you state with reference number + "browse the directory" link
- [ ] `prefers-reduced-motion` removes Reveal animation
- [ ] No console errors or warnings in production build
- [ ] `pnpm build` succeeds; all routes appear in build output

---

## 12. OPEN HANDOFF FLAGS (TODO comments in code)

1. **Founder publish toggle per industry** — `showFounder` field exists; admin sets true when ready. Current default: `false`.
2. **Form destination** — `submitApplication()` is a stub. Wire to Resend / HubSpot / GoHighLevel / Calendly.
3. **Provider Playbook PDF** — `public/provider-playbook.pdf` is a placeholder. Replace.
4. **Trust signals** — schema can extend with `testimonials: []` later when content is collected. Not in v1.
5. **Real imagery** — replace hero placeholders with actual industry photos; founder portrait when going live.
6. **Pricing copy in FAQ** — drafted softly ("listing is free; brand voice interview qualifies for marketing services"). Confirm with legal before launch.
7. **Marketing Mayhem deeper integration** — currently referenced in plan section's lead paragraph and AI prompt. Decide if a dedicated book/lead-magnet module is wanted.
8. **Storage upgrade path** — JSON-on-disk works for v1. When admin volume justifies, swap `lib/industries.ts` to a Postgres adapter without changing the admin form.

---

## 13. WHAT TO BUILD FROM (DESIGN REFERENCE)

Use the existing design prototype in this project as the visual + structural reference:

- **`FABP Invitation Landing.html`** — the canonical layout, motion, typography, spacing
- **`styles.css`** — port directly into `app/globals.css` + Tailwind config (colors, fonts, spacing, shadows, motion)
- **`components.jsx`** — port section-by-section to TypeScript React components in `components/landing/`
- **`configs.jsx`** — port to the 8 seed JSON files in `data/industries/`
- **`tweaks-panel.jsx`** — IGNORE. The Tweaks panel is a design-time tool. The admin UI replaces it in production.

Match the editorial restraint, warm off-white surfaces, serif/mono pairing, 0.5px hairlines, layered hero with floating "Listed" card, and tight section padding. Do not pull components from generic Tailwind UI kits.

---

End of master prompt. Build everything in this document. Ask before deviating from any locked decision.
