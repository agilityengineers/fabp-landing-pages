# Find a Business Pro Directory

_Started 2026-05-04 00:49 UTC_

---

## User



## Assistant

I'll start with Step 1 as you requested — clarifying questions before any design work. Let me also peek at your sketch and the parent site context to ask sharper questions.

_[tool: view_image]_

_[tool: web_search]_

_[tool: questions_v2]_

I have enough context to ask sharp questions. Per your instructions and ground rules, I'll do **Step 1 only** — clarifying questions — and stop. (Quick note on your request to "review the parent site": I'll work from the brand cues you confirm here rather than recreating its UI verbatim, so this template ends up as an original, elevated design that complements the parent rather than copying it.)

Before I ask the questions in the form, here's what I've gathered as a starting point so you can correct me:

- **Parent positioning**: a directory connecting business owners with vetted business pros (attorneys, CPAs, consultants, advisors, M&A, fractional CFOs, coaches, etc.).
- **Audience for THIS page**: the *professional*, not the buyer. The page sells "list yourself" — leads, authority, exclusivity.
- **StoryBrand cast (my read)**: Hero = the professional drowning in expensive, low-quality lead-gen. Guide = Find a Business Pro. Plan = Apply → Get vetted → Get listed → Get matched. Success = qualified inbound; Failure = invisibility, wasted ad spend.
- **Core architectural ask**: one master template that drops into Replit and re-skins per industry via a config file (CPAs, M&A advisors, etc.) with no design breakage.

Now the questions — answer what you can and skip what you haven't decided; I'll flag the gaps when we move to Step 2.

## User

Questions answered:
- brand_assets: logo url = https://www.findabusinesspro.com/images/2020-01-09_20-58-40-clear3.png
Main color = #1F5181
Secondary color = #548C29
Tertiary color = #232323
- parent_screenshots: uploads/parent_screenshots-1777856511098.png
- villain: Wasted ad spend on Google/LinkedIn that doesn't convert, Being invisible in a crowded directory market, Low-intent referral leads who ghost, Time spent chasing leads instead of practicing their craft, Race-to-the-bottom marketplaces (Thumbtack/Bark style), All, and you can be creative.
- stakes: Lost revenue from leads going to competitors, Slow growth / dependence on word-of-mouth alone, Eroding authority vs. peers who show up online, Burning out on marketing they're not built for
- success_vision: Ninety days is going from chaos and mayhem to a clear 90-day plan that helps you focus on your ideal client profile. I wrote a book called Marketing Mayhem, and you can pull information from that book if you need additional information, but the most important part is going from being unorganized to having an organized approach to focusing on your target audience and your ideal client profile. 
- differentiators: Vetted / curated network (not pay-to-play spam), Category exclusivity per market, Owned content/SEO halo from the parent directory, Affordable flat fee vs. per-lead pricing, Founder-led, personal onboarding, Backed by an established directory with existing traffic, Editorial / article amplification, Buyer-intent traffic (not tire-kickers)
- pricing_disclosure: This thing is not prominent. We allow members to sign up for free, but if they sign up, we offer them to go through what we call a brand voice interview. As part of that process, we will determine if it makes sense for us to offer marketing services based on their situation and if they qualify.
- primary_cta: Book a 15-min intro call
- secondary_cta: Download the Provider Playbook (PDF)
- form_fields: Name, Email, Phone, Profession / category, City / metro served, Website / LinkedIn, Years in practice, Current monthly marketing spend, Why you'd be a fit (short answer)
- trust_signals: Nothing yet — design it to scale in later
- industries_at_launch: Accountants
Agile Consulting
Attorneys
Business Exit Planning
Business Strategy
Consultants
Financial Advisors
Marketing Agency
CPAs, M&A advisors, business attorneys, fractional CFOs, business coaches,
- what_varies: Headline + subhead, Industry-specific testimonials, Hero imagery, Villain / pain points, Success vision copy, URL slug + meta SEO, Stat callouts (avg. lead value, etc.), Form 'profession' field default
- what_stays_fixed: Logo + nav, Section structure / order, Type system + spacing, Footer + legal, Form behavior + destination, Color system (only accent flexes)
- tone: Premium / understated luxury B2B
- visual_direction: 1
- imagery_strategy: Decide for me
- tech_stack: Next.js (App Router) — most flexible, best SEO
- variant_strategy: Separate routes (/cpas, /attorneys, etc.) from one config folder
- form_destination: I'll tell you later — leave a clean integration point
- must_have_sections: Hero with one-liner + CTAs, The problem (villain + stakes), Find a Business Pro as Guide (empathy + authority), The Plan (3 simple steps), What you get (value props grid), Sample profile preview, FAQ, Footer, Final CTA + form, I would like for this to be modular. Ultimately, I would love to be able to turn this on and off by a toggle switch as the admin.
- scope_for_v1: Build a fully interactive hi-fi prototype here, then write the master prompt
- anything_else: The goal is for this to be modular and functional. Ultimately, the admin should have the ability to go in and quickly create a page per industry and have as much flexibility as possible. I also want to make sure that you are open to being as creative as possible. I want it to look better than the existing site using the color scheme that we already have. Do your best. Good luck.

## Assistant

Excellent — clear answers. Let me look at your screenshot, then walk you through Step 2 (key design decisions) before building.

_[tool: view_image]_

Got it. I have what I need. Here's **Step 2 — key design decisions** with tradeoffs and my recommendations. Read through, push back where you disagree, and I'll execute Step 3 (master prompt) + the hi-fi prototype right after.

---

## 1. Page structure (StoryBrand-aligned)

**My recommendation — 11 modular sections, in this order:**

| # | Section | StoryBrand role | Notes |
|---|---|---|---|
| 1 | Hero | Character + problem hint | One-liner, primary + secondary CTA, subtle product peek |
| 2 | Problem | Villain + stakes (external/internal/philosophical) | The 3-tier pain stack — wasted spend, invisibility, burnout |
| 3 | Empathy + Authority | Guide | Founder voice + "we built this because..." + soft proof |
| 4 | The Plan | Plan | 3 steps: Apply → Brand Voice Interview → Get listed & matched |
| 5 | Value grid | Success preview | 6 differentiators as cards |
| 6 | Sample Profile preview | Tangibility | Mock of what their listing looks like — reduces risk |
| 7 | Stat callouts | Stakes/success | Industry-variant stats (avg. lead value, etc.) |
| 8 | Marketing Mayhem → Method | Transformation | Visualize the chaos→clarity 90-day arc from your book |
| 9 | FAQ | Objection handling | Pricing handled here softly |
| 10 | Final CTA + form | Direct CTA | Full application |
| 11 | Footer | — | Standard |

**Every section is independently toggleable from the admin** — that's your modularity ask. I'll build a `sections.enabled` map in the config so you flip booleans on/off per industry without touching code.

**Tradeoff to flag:** with no trust signals yet, sections 6 (sample profile) and 8 (Marketing Mayhem framework) are doing extra heavy lifting on credibility. They should be polished — they're substituting for testimonials until you have them.

---

## 2. Visual system — elevating, not cloning

The parent uses #1F5181 (deep blue), #548C29 (green CTA), #232323 (charcoal), with a dark photographic hero and white nav. To take it premium without losing brand recognition:

**Keep:**
- Deep blue as primary identity color (#1F5181)
- Green as conversion accent (#548C29)
- Charcoal as text

**Elevate:**
- **Background:** swap to a warm off-white (oklch ~98% L, slight cream) instead of pure white — instantly reads more premium B2B
- **Type pairing:** **Fraktion / Söhne-style geometric sans for body** + **a refined serif (Source Serif Pro / Newsreader) for hero & section titles** — the serif is the single biggest "elevated B2B" lever and the parent doesn't use one
- **Depth system:** 3-tier shadow scale + subtle 1px hairlines (oklch 0% L 0% C / 8%) instead of flat blocks
- **Hero treatment:** instead of full-bleed photo with white text, use a **split editorial hero** — type-led left, layered product mock right (sample profile card peeking in)
- **Micro-interactions:** number counters on stats, hover lift on cards, scroll-revealed step numbers in The Plan
- **Brand-mark refresh in nav:** keep your logo, but pair it with refined nav typography and a thin underline indicator

Net effect: same brand DNA, but feels like a Big-4 consultancy site rather than a directory.

---

## 3. Industry customization architecture

**Three viable patterns:**

| Pattern | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Static config files per industry** (`config/industries/cpas.json`) consumed by Next.js dynamic route `/[industry]/page.tsx` | Clean, version-controlled, fast, SEO-perfect, zero infra | Admin edits = code commits | ✅ **Recommended for v1** |
| B. Headless CMS (Sanity/Payload) | Non-technical edits, true admin UI | Adds infra, cost, complexity | Phase 2 — we'll structure the JSON schema so it lifts directly into Sanity later |
| C. URL params single route | Trivially fast to spin up | Bad SEO (all variants share one URL) | ❌ Kills your SEO halo strategy |

**The schema** (every key optional except `slug`, `industry`, `headline`):
```ts
{
  slug, industry, seo: { title, description, ogImage },
  hero: { eyebrow, headline, subhead, primaryCta, secondaryCta, image },
  problem: { villain[], stakes[] },
  guide: { headline, body },
  plan: [{ step, title, description }],
  value: [{ icon, title, description }],
  sampleProfile: { name, role, city, bio, specialties[], stats },
  stats: [{ value, label }],
  faq: [{ q, a }],
  testimonials: [{ quote, name, role, company }], // empty for now
  sections: { hero: true, problem: true, ... }    // admin toggles
  accentHueShift: 0  // -20 to +20 oklch hue, optional
}
```

I'll build **CPAs fully** as the worked example and stub the other 7 industries with the schema filled to 60% — you finish them.

---

## 4. Conversion mechanics

- **Primary CTA:** "Book a 15-min intro call" (sticky in nav after scroll past hero)
- **Secondary CTA:** "Download the Provider Playbook" (PDF) — appears in hero + final CTA
- **Form** lives in section 10, opens inline (not a modal — modals tank conversion on B2B). Fields are a 2-step progressive form: step 1 (name/email/phone/profession/city) unlocks step 2 (years/site/spend/fit) — fewer fields visible = more starts.
- **Form integration point:** stubbed `submitApplication(data)` in `/lib/forms.ts` with TODO comments for HubSpot/Resend/etc. — you swap one function later.
- **No pricing on the page** per your direction — soft mention in FAQ ("Listing is free; we offer optional brand-voice interviews to qualify members for marketing services").

---

## 5. Tech stack

You picked Next.js (App Router) — that's the right call here. Specifically:

- **Next.js 15 App Router** — dynamic route `app/[industry]/page.tsx` reads from `config/industries/[industry].json`, generates static at build time via `generateStaticParams`
- **Tailwind v4** — design tokens map 1:1 to your color system
- **shadcn/ui** components only where useful (Form, Accordion, Sheet) — otherwise hand-rolled so it doesn't read as generic
- **`next/font`** for self-hosted fonts (no external CSS, faster LCP)
- **Zod** for the industry config schema → typed throughout, fails loudly if a config is malformed
- **Vercel-style deploy on Replit** with a `replit.nix` and clear `invitation.findabusinesspro.com` DNS instructions

---

## What I'm flagging as not-yet-decided

1. **Founder name + photo** for the empathy/authority section
2. **Final form destination** (you said you'll tell me later — I'll leave a clean integration point)
3. **Pricing language** in FAQ — I'll write it in StoryBrand voice using your "free signup → brand voice interview → optional services" answer; you can edit
4. **Imagery** — you said decide for me. I'm going with: **mix of editorial portraits (placeholder) + product UI mocks of sample profiles**. Real portraits when you supply them.
5. **Marketing Mayhem book integration** — I'll reference it once (in the founder/guide section as authority signal) and use the chaos→clarity arc as the visual metaphor for section 8. If you want a deeper book tie-in, tell me.

---

## What I'll build now

A working Next.js-style hi-fi prototype rendered in a single HTML file — fully interactive (sticky nav, scroll reveals, working accordion, working 2-step form, industry-switcher in the top-right that hot-swaps the entire config so you can see CPAs vs. Attorneys vs. Fractional CFOs live), with **Tweaks** exposing accent hue, font pairing, hero variant, and section on/off toggles (mirroring the admin you want).

Once you see it, I'll write Step 3 — the copy-paste master prompt for Claude Code on Replit.

**One ask before I build:** any objections to the structure/order above, or want me to swap anything? If silent, I'll proceed as specified.

Building now.

## User

I have the founder's name in the photo, but I'm not sure if I want to use it. I want to at least have it as a toggle feature in the back of the application if I decide to turn it on or not.  As I take this over to Replit, I just want you to remind me of these things that need to be flagged. Go ahead, you're approved. Start building.

## Assistant

Approved — building now. I'll note the founder toggle and keep a running "handoff flags" list for Replit.

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: read_file]_

Good, I have what I need. Now let me set up the project.

_[tool: write_file]_

_[tool: snip]_

Now the components and main HTML.

_[tool: write_file]_

_[tool: snip]_

Now the styles file.

_[tool: write_file]_

_[tool: snip]_

Now the main HTML file that ties everything together.

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

The prototype is live. Here's **Step 3** — the master prompt for Claude Code on Replit, plus the running list of handoff flags you asked me to track.

---

## 🚩 Handoff Flags — Open Decisions for Replit

Carry these into the Replit build. Each is currently stubbed in the prototype:

1. **Founder toggle** — `showFounder` boolean per industry. Currently `false` by default. Photo + bio swaps in/out cleanly when on. *You'll decide per-industry whether to publish it.*
2. **Form destination** — `submitApplication(data)` is a stubbed integration point in `/lib/forms.ts`. Wire to Resend / HubSpot / GoHighLevel / Calendly when chosen.
3. **Provider Playbook PDF** — secondary CTA points to `/provider-playbook.pdf` placeholder. Replace with the real asset.
4. **Trust signals** — sections are designed to scale in (testimonials, logos, counts) but currently empty. The schema has `testimonials: []` ready.
5. **Pricing language in FAQ** — drafted softly per your direction ("listing is free; brand voice interview qualifies for marketing services"). Confirm copy with legal before launch.
6. **Real portraits + sample profile imagery** — placeholders use editorial striped frames with mono captions. Drop in real photos when available.
7. **Hero image per industry** — `heroImageCaption` per config; the image itself is a placeholder.
8. **Marketing Mayhem deeper integration** — currently referenced once in Guide section + the "Mayhem→Method" 90-day arc. Decide if you want a dedicated book module / lead magnet.

---

## 📋 Master Prompt — paste this into Claude Code on Replit

````
You are building `invitation.findabusinesspro.com`, a Next.js 15 (App Router) master landing-page template for Find a Business Pro. The page recruits ideal service providers across many industries to join the directory. It is StoryBrand-structured, premium B2B in aesthetic, and must duplicate cleanly across industries via static JSON config files.

## PROJECT GOAL
- Single Next.js codebase deployed at `invitation.findabusinesspro.com`.
- Routes: `/[industry]` (e.g. `/cpas`, `/attorneys`, `/fractional-cfos`).
- Each route is statically generated from `config/industries/[slug].json`.
- Admin can publish a new industry by adding one JSON file — zero code changes.
- Page sections are individually toggleable per industry via a `sections` boolean map.

## TECH STACK
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4 with custom design tokens
- `next/font` for Newsreader (serif) + Inter Tight (sans) + JetBrains Mono (mono) — self-hosted
- Zod for industry config schema validation
- shadcn/ui only for: Accordion (FAQ), Form primitives. Hand-roll everything else.
- No CMS. JSON configs in repo. Schema is structured to lift cleanly into Sanity later.

## FILE STRUCTURE
```
app/
  layout.tsx                # root, fonts, metadata defaults
  page.tsx                  # redirects to /cpas (default)
  [industry]/
    page.tsx                # the landing page — reads config, renders sections
    not-found.tsx
  globals.css               # tokens + Tailwind layers
components/
  Nav.tsx
  Hero.tsx
  Problem.tsx
  Guide.tsx
  Plan.tsx
  ValueGrid.tsx
  SampleProfile.tsx
  Stats.tsx
  MayhemArc.tsx
  FAQ.tsx
  FinalCTA.tsx
  Footer.tsx
  ui/
    Eyebrow.tsx
    Reveal.tsx
    Button.tsx
    SectionHead.tsx
config/
  base.json                 # brand, founder, fixed copy
  industries/
    cpas.json
    attorneys.json
    fractional-cfos.json
    business-coaches.json
    ma-advisors.json
    agile-consulting.json
    marketing-agencies.json
    exit-planning.json
  schema.ts                 # Zod schemas for base + industry
lib/
  config.ts                 # loadIndustry(slug), listIndustries()
  forms.ts                  # submitApplication() — INTEGRATION POINT
public/
  provider-playbook.pdf     # placeholder
  logo.svg
```

## DESIGN SYSTEM (tokens, in globals.css)

Colors (parent brand elevated):
- --blue-900: #0f3458 (accent-deep, primary CTA bg)
- --blue-700: #1f5181 (parent primary, accent)
- --green-600: #548c29 (parent secondary, success/check)
- --ink-900: #161412 (warm near-black, body text dark mode)
- --ink-700: #34322e
- --ink-500: #6c6862
- --paper:   oklch(98% 0.006 75) (warm off-white background)
- --paper-2: oklch(96% 0.008 75)
- --rule:    oklch(85% 0.005 75)

Typography:
- Headlines: Newsreader (serif), letter-spacing: -0.012em, line-height 1.05
- Body: Inter Tight (sans), 16px / 1.55
- Eyebrows + captions + UI labels: JetBrains Mono, 11px, uppercase, letter-spacing 0.06–0.14em
- Single h1 per page, fluid: clamp(40px, 5.5vw, 72px)

Spacing & shape:
- Container max-width 1240px, side padding 32px (22px on mobile)
- Section padding 120px desktop / 72px mobile
- Radii: sm 6px, md 10px, lg 18px
- 3-tier shadow scale (sh-1 / sh-2 / sh-3) using rgba(15,52,88, ...) for brand-tinted depth
- 0.5px hairlines (var(--rule)) instead of 1px borders

Motion:
- IntersectionObserver-based reveal: opacity 0→1, translateY 14px→0, 700ms cubic-bezier(.2,.7,.2,1)
- Buttons: hover translateY -1px, arrow-icon translateX 3px
- FAQ: grid-template-rows transition for smooth open/close
- Respect prefers-reduced-motion

## STORYBRAND SECTION ORDER (each toggleable)
1. Hero — eyebrow, h1, subhead, primary CTA + secondary CTA, 3 trust meta-items, layered "sample listing" peek card on the right
2. Problem — 4 villain cards (2x2 grid) + dark stakes panel underneath
3. Guide — 2-col: empathy/authority copy left, founder portrait OR Marketing Mayhem pull-quote right (toggle)
4. Plan — 3 horizontal steps with connecting rule, big serif numerals
5. Value Grid — 6 cards (3x2), differentiators
6. Sample Profile — browser-chromed card showing what the listing looks like
7. Stats — dark band, 3 oversized stats (industry-variant)
8. Mayhem→Method arc — 4-node 90-day timeline with gradient rule
9. FAQ — accordion
10. Final CTA — 2-col: copy left, 2-step progressive form right
11. Footer — brand, links, contact

## INDUSTRY CONFIG SCHEMA (Zod, in config/schema.ts)

```ts
import { z } from "zod";

export const industrySchema = z.object({
  slug: z.string(),
  industry: z.string(),
  industryShort: z.string(),
  industryPlural: z.string(),
  seo: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    subhead: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string(),
    heroImageCaption: z.string(),
    heroImage: z.string().optional(),
  }),
  problem: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    villains: z.array(z.object({ title: z.string(), body: z.string() })).length(4),
    stakes: z.array(z.string()).min(3).max(5),
  }),
  guide: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    authority: z.array(z.string()).min(2).max(4),
  }),
  plan: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    steps: z.array(z.object({ title: z.string(), body: z.string() })).length(3),
  }),
  value: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    items: z.array(z.object({ title: z.string(), body: z.string() })).length(6),
  }),
  sampleProfile: z.object({
    name: z.string(),
    role: z.string(),
    city: z.string(),
    tagline: z.string(),
    specialties: z.array(z.string()).min(3).max(6),
    stats: z.array(z.object({ v: z.string(), l: z.string() })).length(3),
    photo: z.string().optional(),
  }),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).length(3),
  mayhem: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    arc: z.array(z.object({ phase: z.string(), label: z.string(), note: z.string() })).length(4),
  }),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).min(4),
  testimonials: z.array(z.object({
    quote: z.string(), name: z.string(), role: z.string(), company: z.string().optional(),
  })).default([]),
  sections: z.object({
    hero: z.boolean(), problem: z.boolean(), guide: z.boolean(), plan: z.boolean(),
    value: z.boolean(), sampleProfile: z.boolean(), stats: z.boolean(),
    mayhem: z.boolean(), faq: z.boolean(), finalCta: z.boolean(),
  }),
  showFounder: z.boolean().default(false),
  accentHueShift: z.number().min(-30).max(30).default(0),
});

export const baseSchema = z.object({
  brand: z.object({ name: z.string(), parentUrl: z.string(), phone: z.string() }),
  founder: z.object({ name: z.string(), title: z.string(), bio: z.string(), photoCaption: z.string() }),
});
```

## STATIC GENERATION

`app/[industry]/page.tsx`:
- `generateStaticParams()` → returns slugs from `config/industries/*.json`
- `generateMetadata()` → reads `seo` block from the config
- Renders sections in order, gated by `config.sections[name]`

## FORM HANDLING

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
  // For now: POST to /api/applications which logs to console and returns 200
}
```

Form is 2-step progressive (5 fields → 4 fields). Server action submits.

## ACCESSIBILITY & SEO
- Semantic landmarks (header/main/footer/section + aria-labelledby)
- All interactive elements keyboard-accessible
- prefers-reduced-motion respected
- Per-industry <title> + <meta description> + Open Graph
- JSON-LD `Organization` + `Service` schema injected per page
- Sitemap auto-generated from industries
- robots.txt allows indexing

## DEPLOYMENT TO REPLIT
- `replit.nix` pinning Node 20 + pnpm
- `.replit` run command: `pnpm build && pnpm start`
- Environment: NEXT_PUBLIC_SITE_URL=https://invitation.findabusinesspro.com
- DNS: CNAME `invitation` → Replit deployment URL
- Cloudflare (or registrar) SSL set to "Full"

## ACCEPTANCE CRITERIA
- [ ] All 8 industry routes render statically (`/cpas`, `/attorneys`, etc.)
- [ ] Adding a new industry = adding 1 JSON file (verified by adding a 9th)
- [ ] Each section renders only when its `sections.<name>` flag is true
- [ ] `showFounder` toggle swaps founder portrait ↔ pull-quote without layout break
- [ ] Hero, sample profile, and final-CTA all responsive at 360px / 768px / 1280px
- [ ] Lighthouse: ≥95 Performance, ≥95 Accessibility, ≥95 SEO
- [ ] Form submission posts to `submitApplication()` and shows thank-you state
- [ ] Zod validation fails the build if any config is malformed
- [ ] All copy comes from configs — no hardcoded strings in components except UI labels
- [ ] `prefers-reduced-motion` removes Reveal animation
- [ ] No console errors or warnings in production build

## OPEN DECISIONS (handle as TODOs in code)
1. Founder publish toggle per industry — `showFounder` field exists; admin sets true when ready
2. Form destination — `submitApplication()` is a stub
3. Provider Playbook PDF — placeholder file; replace
4. Trust signals — `testimonials: []` ready; populate when collected
5. Real imagery — replace hero/profile/founder placeholders
6. Pricing copy in FAQ — confirm with legal
7. Marketing Mayhem book module — decide if a dedicated section is wanted
8. Per-industry accent hue — `accentHueShift` exists in schema; default 0

Build the prototype currently in our chat as the visual + structural reference. Match the editorial restraint, the warm off-white, the serif/mono pairing, the 0.5px hairlines, and the layered hero. Don't pull components from generic Tailwind UI kits — hand-roll for editorial feel.
````

---

## What's in the prototype right now

- **Live industry switcher** in the nav — try CPAs → Attorneys → Fractional CFOs etc.; the entire page swaps
- **Working 2-step form** with progressive disclosure and a thank-you state
- **Working FAQ accordion**
- **Tweaks panel** (toolbar toggle): module on/off, founder on/off, accent palette, serif swap — mirrors the admin you'll build
- **Scroll-reveal animations**, sticky nav, hover micro-interactions
- **Visible handoff banner** in bottom-left as a constant reminder during review

When you're ready, paste the master prompt into Claude Code on Replit. The 8 handoff flags above are the only open decisions.

## User

Re-imagine what you've created. It looks like you've created a fully functional website, and what I'm looking for is a landing page. Ultimately, that landing page needs to point back to the actual directory at the main site. Were you able to pull anything from the actual website, or do I need to provide you with additional information?

## Assistant

_[tool: snip]_

Good feedback. Let me address both points first, then re-imagine.

**On pulling from the parent site:** I had limited access to the live site — I worked from the screenshot you uploaded earlier (logo, blue/green palette, dark hero photo, "We Help You Find Qualified Service Providers" headline) plus the brand colors and logo URL you gave me. That was enough to stay on-brand, but **not** enough to mirror specific copy, testimonials, member counts, or the exact category list as it appears today. If you want tighter alignment, the most useful things you could share are:

1. 2–3 more screenshots: the full homepage scrolled, the "How It Works" page, and a sample member profile (so the "sample listing" peek matches reality)
2. Any existing tagline or one-liner you use elsewhere (LinkedIn, email signature, the book)
3. Real metro/category coverage stats if you'd like them on the page

**On "fully functional website" vs. landing page** — you're right. I overbuilt. A real landing page is one screen of intent: hook, proof, plan, ask. It should send the heavy lifting (browse pros, articles, how-it-works) **back to the directory**, not duplicate it.

Here's the reframe I'm proposing — push back if any of it is off:

| Currently | Proposed |
|---|---|
| 11 sections, sitewide nav, multi-page footer | **5 sections**, no nav links, single conversion goal |
| Internal anchor nav (#problem, #plan, #faq) | **No nav links** — just logo + "Visit main site →" + primary CTA |
| Footer links to /apply, /faq, etc. | Footer is one line: ©, link back to `findabusinesspro.com`, contact |
| Sample profile, stats band, mayhem arc, FAQ all expanded | Compress into a tight value strip + 3-step plan + sample listing peek + form |
| Feels like a site | Feels like a one-page invitation |

**New section order (5 only):**
1. **Hero** — the invitation. Eyebrow, headline, one-paragraph subhead, primary CTA (Book intro call), secondary (Playbook PDF). Sample-listing peek card.
2. **The problem & the promise** — combined: 4 villains as a tight strip, then "Here's what changes" success vision.
3. **The plan** — 3 steps. That's it.
4. **What you get + sample listing** — value bullets next to the browser-chromed listing card.
5. **Apply** — final CTA + 2-step form.

**Plus:** persistent "Back to the directory →" link in the top-right that points to `findabusinesspro.com`, and a closing line in the form thanks-state that says "While you wait, browse the directory →".

I'll keep all the same admin toggles and industry config system intact — that's the architecture, not the surface. The change is purely in scope and density.

**Two questions before I rebuild:**
1. Approve the 5-section compression? Or do you want to keep FAQ (it's the only one that handles real objections — pricing, exclusivity, cancellation)? I'd recommend keeping it as a compact 4-question accordion → that gets us to 6 sections.
2. Do you want me to wait on more parent-site screenshots before rebuilding, or proceed now with what we have?

If you say "go," I'll rebuild it as a true landing page — denser, sharper, pointed at the directory — within the same file structure so your Replit prompt doesn't change.

## User

I approve the five-section compression.  What you provided is about 50 to 60% good. I just would like to see it look a bit more tight. You can throw in an image or two that are industry-based images. You can remove the "What you get in the sample listing" section.  I was expecting it to look a little bit more visually appealing.

## Assistant

[Snipping completed earlier work to free up context.]

_[tool: snip]_

Approved — rebuilding as a tighter landing page with real industry imagery, more visual richness, and 4 sections (Hero, Problem→Promise, Plan, Apply + compact FAQ).

Let me start fresh with new components.

_[tool: write_file]_

[Continuing the rebuild. Now I need a slimmer components file and updated configs with industry image URLs, then the main HTML.]

_[tool: snip]_

_[tool: write_file]_

[Acknowledged — continuing.]

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

_[tool: snip]_

_[tool: snip]_

The v2 prototype is live at `FABP Invitation Landing.html` — tightened to a true landing page (Hero / Problem→Promise / Plan / Apply+FAQ / Footer) with industry imagery in the hero, the industry switcher in the nav, and the admin-style Tweaks panel for module visibility, accent palette, and industry preview.

**Next steps when you're ready:**
- Confirm the structure feels right, then say the word and I'll generate the updated **Step 3 master prompt** for Claude Code on Replit (reflecting the slimmer 4-section structure).
- The 8 handoff flags from earlier still stand — founder toggle, form destination, Playbook PDF, trust signals, real imagery, hero image per industry, pricing FAQ legal review, Marketing Mayhem deeper integration.

## User

Verifier agent check completed

## Assistant

Two quick CSS fixes.

_[tool: str_replace_edit]_

_[tool: done]_

Both fixes applied — italic descenders now clear the villain rows (margin bumped to 40px + line-height 1.1 + 4px padding), and floating-card stat values truncate cleanly with ellipsis instead of wrapping.

## User

Replace the logo with the following.

## Assistant

I'll swap in the actual logo file in place of the SVG mark + brand-text construction.

_[tool: copy_files]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

Logo swapped in — actual `fabp-logo.png` now lives in the nav at 40px tall (32px on mobile), replacing the placeholder SVG + text mark.

## User

Increase the size by 50%.

## Assistant

_[tool: str_replace_edit]_

Logo bumped to 60px (48px on mobile).

## User

Here's the size of the logo.

## Assistant

I don't see an attachment with the size — could you resend it? You can either:

- Drop the screenshot/file directly into chat, or
- Tell me the pixel height you want (e.g. "80px" or "make it match this image's height")

Once I know the target, I'll update it.

## User

Please double the size of the logo.

## Assistant

_[tool: str_replace_edit]_

Doubled to 120px (96px on mobile).

## User

So it's not looking good on the page. I'm gonna give you an alternative.

## Assistant

Got it — swapping in the new logo. I'll also dial the size back to a more sensible 64px since this version reads denser at smaller heights.

_[tool: copy_files]_

_[tool: str_replace_edit]_

_[tool: snip]_

New logo swapped in at 64px (48px mobile). Refresh to see it.

## User

Use this updated file and increase the size by 60%.

## Assistant

64 × 1.6 = ~102px.

_[tool: copy_files]_

_[tool: str_replace_edit]_

_[tool: snip]_

Logo updated and bumped to 102px (76px mobile).

## User

Can you tighten up the sections by cutting the space in the margins by half?  This can be done throughout the entire site.

## Assistant

I'll halve the vertical section padding throughout — hero, problem-promise, plan, apply, and footer.

_[tool: str_replace_edit]_

Done — all section padding cut roughly in half:

- Hero: 64/110 → 32/56 (mobile 32/64 → 16/32)
- Problem→Promise: 100/110 → 50/56
- Plan: 110 → 56 (head margin 64 → 32)
- Apply: 110 → 56
- Footer: 36 → 18

Refresh to see the tighter rhythm.

## User

This is a top header.

## Assistant

I'm not sure what you'd like me to do with the top header — could you clarify? A few possibilities:

1. **Add a top utility bar** above the nav (e.g. phone, "Member Login," "Visit directory")?
2. **Make the existing nav stick differently** or restyle it?
3. **Tighten the header itself** (its padding wasn't included in the section-margin halving — it's currently 14px top/bottom)?
4. **Replace the header entirely** with something different?
5. Or did you mean to attach a screenshot/reference?

Let me know which direction and I'll execute.

## User

The margins in the top header can be reduced by 50%.

## Assistant

Got it.

_[tool: str_replace_edit]_

Header padding cut from 14px → 7px top/bottom.

## User

Help understanding the drop downs when it comes to the different industries. I like it and want to keep the functionality, but I need to understand how it will work in production. I want the ability to choose the different industries as an admin, but I also want it to create a page for that industry. So the way it's currently laid out, I'm not sure what happens when I actually take it over to Claude Code when it comes to the different industries, but I don't want to lose the information that you've created. So don't change anything, just help me understand.

## Assistant

Great question — and you should ask this *before* Replit, not after. Here's exactly how it translates.

## What the dropdown is doing right now (in this prototype)

The dropdown in the nav is a **preview switcher**. It exists for one reason: so you (and I) can see how the page looks for each industry without rebuilding 8 separate prototypes. In the real Next.js build on Replit, **this dropdown disappears**. It's a design tool, not a production feature.

## What ships to production

Each industry becomes its own URL — its own page — generated automatically from a JSON config file. You pasted `cpas` into the URL bar, you get the CPA page. You paste `attorneys`, you get the Attorney page. Same template, different content.

```
invitation.findabusinesspro.com/cpas             ← reads cpas.json
invitation.findabusinesspro.com/attorneys        ← reads attorneys.json
invitation.findabusinesspro.com/fractional-cfos  ← reads fractional-cfos.json
invitation.findabusinesspro.com/business-coaches ← reads business-coaches.json
... etc
```

That's it. One template, eight (or eighty) URLs. Google indexes each one separately for its own SEO juice.

## How a new industry gets added in production

Three steps. No design work, no code changes:

1. **Copy** `config/industries/cpas.json` → rename to `commercial-real-estate.json`
2. **Edit the text** — headline, villains, profile, FAQ, etc. (everything in the JSON)
3. **Deploy** — Replit picks up the new file and `/commercial-real-estate` exists. Done.

The 8 industries I built in the prototype are 8 starter JSON files. They become your seed library. You'd ship with those, then add more whenever you want a new vertical.

## Where your work in this prototype lives

Nothing is lost in translation. Every industry I wrote (CPAs, Attorneys, Fractional CFOs, Business Coaches, M&A Advisors, Agile Consultants, Marketing Agencies, Exit Planners) becomes one JSON file in the Replit project. The headlines, villains, promise stats, sample profile, FAQ — all of it lifts directly into those files.

The master prompt I'll give you for Claude Code will explicitly include: *"Use the content from configs.jsx as the seed data for these 8 JSON files."*

## So what about the admin?

You said you want admin control. Here are the three honest options, in order of effort:

| Option | What it is | Effort | When |
|---|---|---|---|
| **A. Edit JSON files in Replit** | You open `cpas.json` in Replit's file editor, change text, save. Site rebuilds. | Zero | v1, today |
| **B. Lightweight admin UI** | A `/admin` route behind a password that gives you a form to edit each industry's fields, writes back to the JSON file. | ~1 day of Claude Code | v1.5 |
| **C. Real CMS (Sanity/Payload)** | A polished admin dashboard, draft states, image uploads, role permissions. Schema lifts from the JSON we already designed. | ~3–5 days | v2 when you have volume |

I recommend **A for launch**, **B once you've added 2–3 industries and feel the friction**, **C only if a non-technical teammate needs to edit content**.

## What the "module visibility" toggles in the Tweaks panel become

Same translation. Each industry's JSON has a `sections` block:

```json
"sections": {
  "hero": true,
  "problemPromise": true,
  "plan": true,
  "apply": true
}
```

Flip a value to `false` and that section vanishes for that industry only. CPAs can show all four; Attorneys can hide the Plan section if you decide attorneys don't need it. Per-industry control. The Tweaks panel in this prototype is literally previewing those flags.

## Same for the founder toggle and accent

`showFounder: true/false` and `accentHueShift: 0` are also per-industry JSON keys. Set once per file, ship.

---

**Bottom line:** the dropdown is a design ergonomic, not a production feature. In production, every industry is its own URL, fed by its own JSON. The 8 industries I wrote become your starter library. Adding a 9th means adding a 9th file.

When you're ready, say the word and I'll write the master prompt with this baked in: file structure, JSON schema, the eight seed configs, and acceptance criteria that includes *"adding a new industry = adding 1 JSON file."*

## User

Go ahead and write the prompt master prompt, but just keep in mind that I want the ability to set up new pages more simply than what you're describing with JSON. It should be where an admin can identify the industry they want, and even if I use AI in order to help build it out, we can at least pull in information related to a specific industry. I want this functionality within the master prompt of Replit so that Replit knows this ahead of time. It's important that you confirm you understand before I approve you creating the Master Prompt.

## Assistant

Yes — I understand. Confirming back to make sure we're aligned before I write anything:

## What I'm hearing

You want the **admin UX to be a form, not a JSON file**. Specifically:

1. **Admin enters an industry name** (e.g. "Commercial Real Estate Brokers") in an admin UI — not by creating a file.
2. **AI generates the content** for that industry — headlines, villains, promise stats, sample profile, FAQ — using the StoryBrand framework, Marketing Mayhem voice, and the existing template structure as the pattern.
3. **Admin reviews + edits** the generated content in a form (so AI isn't shipping unreviewed copy live).
4. **Admin clicks publish** — the new page goes live at `/[industry-slug]` instantly. No file editing, no Replit redeploy.
5. **Admin can later edit** any existing industry page from the same form (CPAs, Attorneys, etc. are all editable through the admin UI, not by touching JSON).
6. **JSON still exists under the hood** — that's how Next.js stores the data — but the admin never sees it. The form reads/writes the JSON for them.

## Plus the things we've already locked

- StoryBrand structure, 4-section landing page (Hero / Problem→Promise / Plan / Apply+FAQ), per-industry section toggles, founder toggle, accent palette, brand colors, the elevated visual system from the prototype, secondary CTA = Provider Playbook, primary = book intro call, 2-step progressive form, integration point for form destination, Marketing Mayhem references, "Visit the directory" link back to parent, the 8 starter industries as seed content.

## What I'll spec in the master prompt to deliver this

- **Three admin features** Claude Code must build:
  1. **`/admin` route** — password-protected, lists all industries, "Create new" button, edit/publish/unpublish actions per industry.
  2. **AI generator** — admin types the industry name (and optional notes — pricing band, target metro, key pain points, etc.); a server action calls an LLM with the StoryBrand + Marketing Mayhem prompt template I'll write into the codebase, returns a fully-populated draft for that industry, pre-filled into the form.
  3. **Edit form** — every field from the JSON schema rendered as a labeled input/textarea, with "Save draft," "Preview," and "Publish" buttons. Toggles for sections + founder. Accent picker.
- **Storage:** still JSON files (cleanest for v1 on Replit), but written to disk by the admin form via a server action — admin never sees them. Optional path to swap in a real database later without changing the admin UX.
- **The AI prompt template** (a string in the codebase) that takes `{industry, notes}` and returns the full schema. I'll write it in the master prompt so Claude Code drops it in directly.
- **Acceptance criteria:** "Adding a new industry = typing its name into the admin and clicking generate, then publish. No file edits."

## One question before I write it

**Which AI service do you want the generator to call?**

- **Anthropic API (Claude)** — same family as Claude Code; cleanest fit; needs an API key from console.anthropic.com
- **OpenAI API (GPT-4)** — also fine
- **OpenRouter** — lets you swap models later
- **"Decide for me"** — I'll spec Anthropic with a clean swap point so you can change later

Confirm the AI service (or pick "decide for me") and I'll write the master prompt.

## User

I'm going to use Anthropic API.  Let's just make sure the overall structure is within the templates that will be used to create new industries and professions.

## Assistant

Confirmed. The structure stays canonical — every new industry inherits the exact 4-section template (Hero, Problem→Promise, Plan, Apply+FAQ), the visual system, and the schema. The admin types an industry name → Anthropic API generates content into that fixed schema → admin reviews and publishes. Structure is locked; only content varies.

Writing the master prompt now.

_[tool: write_file]_

_[tool: snip]_

_[tool: show_to_user]_

The master prompt is saved at **`REPLIT_MASTER_PROMPT.md`** and now open in your tab. Highlights of what's in it:

**Core architecture**
- Canonical 4-section template locked (Hero / Problem→Promise / Plan / Apply+FAQ) — structure never varies, only content per industry
- Next.js 15 + Tailwind v4 + Anthropic SDK + Zod validation
- Industry data stored as JSON files (admin never touches them); designed to swap to a database later without changing the admin UX

**Admin UI (the part you wanted)**
- `/admin` password-gated, lists all industries
- `/admin/new`: type industry name → "Generate draft with AI" button → Anthropic API drafts the entire schema → admin reviews/edits in the form → publish
- Per-section "Regenerate with AI" buttons for incremental edits
- Section toggles, founder toggle, accent picker, hero image upload — all per industry

**AI generator constraints baked in**
- System prompt enforces: StoryBrand voice, exactly one `<em>` italic phrase per headline, 4 villains in the fixed pattern, 3 promise stats with the right shape, plan steps named consistently, FAQ covering the 4 standard objections, hero photo label format
- All output validated against `industrySchema` before save — invalid drafts surface errors in the UI

**Seed data**
- The 8 industries from this prototype port directly to `data/industries/*.json` — your work is preserved verbatim

**Deployment**
- Env vars list (ANTHROPIC_API_KEY, ADMIN_PASSWORD, etc.)
- Replit config + DNS instructions for `invitation.findabusinesspro.com`

**8 handoff flags** (Section 12) carried forward as TODOs in code:
1. Founder toggle default
2. Form destination integration point
3. Provider Playbook PDF
4. Trust signals (future)
5. Real imagery
6. Legal review of pricing FAQ
7. Marketing Mayhem deeper module
8. Storage upgrade path

Paste the file's contents into Claude Code on Replit when you're ready to build.

## User

Use the master prompt in Replit. I need your help. I love what you created, so I am more likely to import what you've created into GitHub, then pull it into Replit in order to create the back end. Instead of me going through that, are you able to help me continue to build this out via Claude code? And then, when I'm finished, upload it to GitHub?

## Assistant

_[tool: snip]_

Honest answer about the boundaries first, then a concrete path forward.

## What I can and can't do

**What I can do here:**
- Continue iterating on the **frontend** (the prototype you're already running) — refine sections, add new screens, tighten copy, adjust the design system, build interactive states. This stays in HTML/React-in-the-browser.
- Help you **plan and spec** the Next.js backend — architecture, schema, admin flows, prompt engineering for the Anthropic generator, acceptance criteria.
- Build a **working interactive simulation** of the admin UI here in HTML so you can feel the flow before any real backend is wired up.

**What I can't do here:**
- I can't run a real Next.js server, install npm packages, hit the Anthropic API server-side, write to disk in production, or push to GitHub from this environment. I'm a design tool, not a hosted IDE.
- That means I can't build the actual production backend (server actions, file writes, auth middleware, the real Anthropic call). That's Claude Code's job inside Replit.

## The cleanest path forward

Here's the workflow that makes the most of both tools:

| Where | What happens | Tool |
|---|---|---|
| **Here (this chat)** | Frontend prototype, design system, admin UI mockup, master prompt | This conversation |
| **Replit** | Real Next.js project, server actions, Anthropic API, file storage, deploy | Claude Code |
| **GitHub** | Source of truth, version history, deploy hook | Replit's built-in GitHub integration |

The cleanest sequence:

1. **I finish the frontend here** and prepare a clean handoff bundle — all the source files (HTML, JSX, CSS, JSON seed data) plus the master prompt.
2. **You download the bundle** from this project (one click — I can present it as a zip).
3. **You start a fresh Replit project**, paste the master prompt into Claude Code, and tell it: *"Use these source files as the design + content reference"* — drag the bundle in.
4. **Claude Code builds the Next.js backend** around the frontend you already have.
5. **Replit pushes to GitHub** via its built-in integration (Tools → Git → Connect to GitHub).

## What I'd recommend doing right now in this chat

Two things would meaningfully de-risk the Replit handoff:

**Option A: Build the admin UI as an interactive HTML mockup here.**
You'd be able to type an industry name, see a simulated AI draft populate, edit fields, hit "publish," and watch the public page update — all in the browser, no backend. This proves out the UX before Claude Code builds the real thing. You'd see *exactly* what you're asking Replit to build. ~30 min of work.

**Option B: Refine the master prompt with one more pass.**
I can add: example AI input/output, the actual Anthropic prompt string in full, a step-by-step "first 30 minutes in Replit" runbook, and a GitHub setup checklist. Makes the Replit session smoother.

**Option C: Both.**

Which would you like? My recommendation is **C** — the admin mockup is genuinely useful (you'll catch UX issues before they're code), and the prompt polish is cheap.

Once we're done, I'll bundle everything for download in one shot.

## User

Option A: I've decided I am going to finish building it out here, upload it to GitHub, and then if I want to download it to Replit at that point, I will. But for now, let's finish out the design. I'll finish building it out with Claude Code. I'll use Claude Code to upload it to GitHub.

## Assistant

_[tool: snip]_

Got it. So we'll keep iterating on the design here — what would you like to refine or add next?

Some directions we could take:

1. **Add a founder section** with a toggle (so you can see the "with founder" variant before deciding)
2. **Polish a specific section** — Hero, Problem→Promise, Plan, or Apply
3. **Add the admin UI mockup** as a separate page so you can preview what the Replit admin will look like
4. **Refine copy** for any of the 8 industries
5. **Add new sections** you've decided you want (testimonials placeholder, sample profile preview, stats band, etc.)
6. **Adjust visual treatments** — try a different accent palette, hero variant, or section layout

What's the next move?

## User

In this order, let's do 1, 3, and I do want the testimonial placeholder, sample profile, preview stats, band or new sections to be a toggle feature as well.  Please confirm you understand before you start working. Ask any questions if you have questions.

## Assistant

Confirming back before I build:

## What I understand

**Task 1 — Founder section + toggle**
- Add a founder block (photo + name + title + short bio + Marketing Mayhem credibility line) inside the Apply section's left column, beneath the FAQ
- Wired to the existing `showFounder` toggle in the Tweaks panel — flip it on/off live
- Default OFF (you said you're undecided about publishing it)
- Founder data lives in `INDUSTRY_BASE.founder` (already there: Clarence Williams)

**Task 3 — Admin UI mockup as a separate page**
- A new HTML file (`FABP Admin Preview.html`) that simulates the Replit admin
- Shows: industry list view, "+ New industry" flow with simulated AI generation (fake delay + pre-canned draft), edit form with all schema fields, section toggles, accent picker, publish/unpublish
- Purely cosmetic — no real backend, no real Anthropic call. It's a UX preview so you can feel the flow before Claude Code builds it
- Cross-link from the landing page nav (only visible when a "preview admin" affordance is on, or just a small link in the handoff banner)

**Plus — extra section toggles**
- Add three more optional sections, each with its own toggle in the Tweaks panel:
  - **Testimonials placeholder** — designed to scale in later when you collect real quotes; shows "Awaiting trust signals" state for now
  - **Sample profile preview** — a larger, browser-chromed mock of what a listed pro's profile looks like (the floating hero card expanded into a full section)
  - **Stats band** — dark band with 3 oversized industry stats (could pull from `promise.stats` or be its own array)
- All three default **OFF** so the page stays tight; you flip them on per-industry to experiment
- These extend the schema for the Replit handoff — I'll update the master prompt to reflect

## Three quick questions before I build

1. **Where should the Admin Preview link live?** Bottom of the handoff banner ("View admin mockup →"), or a tiny link in the footer? I'm leaning toward the handoff banner since it's already a handoff/dev affordance.

2. **Testimonials placeholder design** — when off (no testimonials collected yet), should the section render *anything* at all? Two options:
   - **(a)** Hide it entirely until you add testimonials (cleanest)
   - **(b)** Show a tasteful "Currently invitation-only — first cohort onboarding" pull-quote treatment that doubles as social proof framing (works as honest copy in the absence of quotes)

   I'd recommend (b) — it earns its space.

3. **Stats band content** — should it reuse the 3 promise stats already in the dark Problem→Promise section, or be a separate set of 3 industry stats? Reusing keeps the schema lean; separate gives more flexibility but more to maintain.

   I'd recommend **separate** — different framing serves different purposes (problem-side stats vs. proof-side stats), and it's only 3 strings per industry.

If you say "go with your recommendations" I'll build it as specified. Otherwise tell me your preferences.

## User

We put the admin preview link at the bottom of the footer, and we will remove it when we get closer to production. I will have Claude Code do something a little bit different later. The testimonials placeholder design, go ahead and hide it entirely until I add a testimonial.

## Assistant

_[tool: snip]_

Confirmed. Building all three:

1. Founder section + toggle (default OFF)
2. Admin preview HTML, link at footer bottom
3. Testimonials, sample profile, stats band — each toggleable, all default OFF; testimonials hidden entirely when empty; stats band uses its own 3-stat array (separate from promise stats)

_[tool: read_file]_

_[tool: snip]_

Building all three additions now.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

I'll add the statsBand/sampleProfile data to the other 7 industries, wire up the new sections in the main HTML, add CSS, and create the admin preview page.

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

Admin preview is live. Three views you can click through:

1. **Industries list** — 8 rows, publish/draft status, edit/view/publish actions
2. **New industry** (top-right "✨ New industry") — the AI generator. Type a name + optional notes → fake-generate spinner → drops you into the edit view with an "AI-generated draft" badge
3. **Edit view** — full form with regenerate buttons per section, section visibility toggles, accent picker, sticky save bar

A banner at the top links back to the landing prototype.

_[tool: fork_verifier_agent]_

Admin UX preview shipped. Click through **Industries → ✨ New industry → Generate → review draft** to see the full flow. Let me know what to refine — or whether to wire any of the regenerate buttons / toggles to actually do something in the mock.

## User

Verifier agent check completed

## Assistant

Fixing the sidebar logo overflow.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Fixed — logo title now ellipses cleanly and "Admin" sits as a mono caption underneath.

## User

Now I'm ready to hand this over to Claude Cote. Anything I should know before we go in that direction?

## Assistant

Before you hand it off, here's everything that'll save you back-and-forth with Claude Code.

---

## 📦 What to give Claude Code

Hand it **all four files**:

1. `FABP Invitation Landing.html` — the landing page reference
2. `FABP Admin Preview.html` — the admin UX reference
3. `configs.jsx` — the 8 industry configs (already in the schema shape it needs)
4. `styles.css` — design tokens

Plus: **the master prompt I wrote earlier in this thread** — that's the spec. Paste it as the first message.

---

## ⚠️ Critical: things the prototype hides that Claude Code must build for real

These are stubbed in the mock and easy to miss:

1. **The AI generator is fake.** The "✨ Generate draft with Claude" button just shows a spinner and drops a hardcoded config in. In production this needs a real server endpoint that calls Anthropic's API, returns a Zod-validated industry config JSON, and writes it to disk. Tell Claude Code: *"The generator must call Anthropic's API server-side using `ANTHROPIC_API_KEY`, prompt with the schema, validate the response with Zod, and only persist on success."*
2. **"Regenerate section" buttons** are the same — they need the same server endpoint, scoped to one section of the schema.
3. **Auto-save is a label.** It doesn't save. Production needs debounced writes to the JSON file (or DB later).
4. **Form submission is `console.log`.** The `submitApplication()` stub needs to be wired to whatever you're using — Resend, HubSpot, GoHighLevel, Calendly. Decide before launch.
5. **Authentication.** The admin has no auth. Add a single-password gate or Replit Auth before the URL goes live.
6. **The "Visit main site →" link** points to `findabusinesspro.com` — confirm that's the production URL.

---

## 🎯 The 8 open decisions (from earlier handoff flags)

Claude Code can scaffold around all of these — but you'll need answers eventually:

1. **Founder toggle per industry** — currently `false` everywhere; flip on when bio + photo are ready
2. **Form destination** — Resend / HubSpot / GoHighLevel / Calendly?
3. **Provider Playbook PDF** — the secondary CTA points to `/provider-playbook.pdf`. Replace placeholder.
4. **Testimonials** — schema has `testimonials: []` ready; populate when collected
5. **Pricing language in FAQ** — confirm with legal before publishing
6. **Real portraits** — placeholders are editorial striped frames; swap when you have photos
7. **Hero image per industry** — placeholder slot exists in schema (`heroImage`)
8. **Marketing Mayhem book module** — currently a single mention; decide if it gets its own section or lead-magnet flow

---

## 🛠 Tech notes Claude Code will appreciate

- **Stack I specced:** Next.js 15 App Router, TypeScript, Tailwind v4, Zod, shadcn/ui only for Accordion + Form. Don't let it pull in MUI / Chakra / a generic UI kit — the editorial feel will die.
- **Fonts are self-hosted via `next/font`:** Newsreader, Inter Tight, JetBrains Mono. The Google Fonts CDN link in the prototype is for prototyping only.
- **The prototype is a single HTML file with everything inlined.** Claude Code needs to split it into the file structure in the master prompt — don't let it just port the HTML.
- **CSS variables are the design system.** Every token in `styles.css` should become a Tailwind theme extension or CSS custom property in `globals.css`. Don't let Claude Code re-pick colors.
- **Reveal animations use IntersectionObserver** — keep that pattern, don't swap to Framer Motion (overkill, bundle bloat, and it'll break SSR if not configured carefully).

---

## 🚀 Recommended order of work for Claude Code

Tell it to build in this sequence:

1. **Scaffold + design tokens + fonts** — verify the warm off-white, hairlines, type pairing match the prototype
2. **One industry rendering statically** (`/cpas`) — get hero + problem + plan + apply working before doing all 8
3. **Industry config loader + Zod validation** — fail the build on bad config
4. **Remaining 7 industries** as JSON only — no code changes
5. **Admin: list + edit views without AI** — just CRUD on JSON files
6. **Admin: generator endpoint + Anthropic integration** — last, because it's the most expensive to iterate on
7. **Form submission + auth + deploy**

Have it deploy to a staging Replit URL first — don't point `invitation.findabusinesspro.com` until you've eyeballed every industry.

---

## ✅ Acceptance test for the handoff

When Claude Code says "done," you should be able to:

1. Visit `/cpas`, `/attorneys`, `/fractional-cfos` etc. — all 8 render statically
2. Add `config/industries/9th-industry.json` and have it appear at `/9th-industry` after rebuild
3. Open `/admin`, click "✨ New industry," type a real industry name, watch a real Claude API call generate a draft, edit it, click Publish, and see it live within 60 seconds
4. Submit the application form on a live page and see it land wherever you wired it
5. Lighthouse 95+ on Performance, Accessibility, SEO

If any of those five fail, it's not done.

---

You're in good shape. The visual system, copy framework, schema, and admin UX are all already designed — Claude Code's job is engineering, not design decisions. Good luck on Replit.

## User

Update the master prompt with the information for Claude code. It looks like what you wrote already was for Replit. I want you to include your recommendations in the Claude code master prompt

## Assistant

Here's the **updated master prompt for Claude Code** — incorporating all the recommendations, the AI-generator scope, the open decisions as TODOs, and the tighter delivery sequence.

Paste this as your **first message** to Claude Code, then attach the four prototype files (`FABP Invitation Landing.html`, `FABP Admin Preview.html`, `configs.jsx`, `styles.css`).

---

````
# Build: invitation.findabusinesspro.com

You are building a master landing-page template for **Find a Business Pro**. The page recruits ideal service providers across many industries to join the directory. It is StoryBrand-structured, premium B2B in aesthetic, and must duplicate cleanly across industries via static JSON config files. It includes a private admin where the owner can spin up a new industry page in minutes — Claude (Anthropic API) drafts the page, the owner edits and publishes.

## REFERENCE FILES (attached)
- `FABP Invitation Landing.html` — the landing page visual + structural reference. Match its editorial restraint, warm off-white, serif/mono pairing, 0.5px hairlines, and layered hero. Don't pull from generic Tailwind UI kits — hand-roll for editorial feel.
- `FABP Admin Preview.html` — the admin UX reference. List view, AI generator flow, edit form with section regenerators, visibility toggles, accent picker, sticky save bar.
- `configs.jsx` — the 8 industry configs already in the schema shape Zod will validate.
- `styles.css` — design tokens. Every token here becomes a CSS custom property in `globals.css` and a Tailwind theme extension. **Don't re-pick colors or type.**

The prototypes are a SINGLE HTML FILE WITH EVERYTHING INLINED. Don't port the HTML — split it into the file structure below.

## TECH STACK (NON-NEGOTIABLE)
- **Next.js 15** (App Router, TypeScript, Server Components by default)
- **Tailwind CSS v4** with custom theme tokens — no other CSS framework
- **Zod** for schema validation
- **`next/font`** for self-hosted Newsreader (serif) + Inter Tight (sans) + JetBrains Mono (mono). The Google Fonts CDN link in the prototype is prototyping-only.
- **shadcn/ui** ONLY for: Accordion (FAQ), Form primitives. Hand-roll everything else.
- **IntersectionObserver** for reveal animations — DO NOT swap to Framer Motion. Overkill, bundle bloat, breaks SSR.
- **Anthropic SDK** (`@anthropic-ai/sdk`) for the AI generator. Server-side only.
- **NextAuth.js** (or Replit Auth if deploying there) for admin gate
- **No CMS.** JSON configs in repo. Schema is structured to lift cleanly into Sanity later.
- **Do not add:** MUI, Chakra, Mantine, Radix beyond what shadcn pulls, Framer Motion, GSAP, Lottie, or any "starter kit" that isn't in the prototype.

## DEPLOYMENT TARGET
- **Hosting: Replit** (Node 20 + pnpm). Will be promoted from staging to production.
- **Domain:** `invitation.findabusinesspro.com` — DO NOT point DNS until staging is green.
- **Env:** `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD` (or NextAuth vars), `RESEND_API_KEY` (or whichever form destination is chosen — see TODOs).

## FILE STRUCTURE
```
app/
  layout.tsx                    # root, fonts, metadata defaults
  page.tsx                      # redirects to /cpas
  [industry]/
    page.tsx                    # landing page — reads config, renders sections
    not-found.tsx
  admin/
    layout.tsx                  # auth gate, sidebar shell
    page.tsx                    # industries list
    new/page.tsx                # AI generator (step 1)
    [slug]/page.tsx             # edit view
  api/
    generate/route.ts           # POST — Claude generates full industry draft
    regenerate/route.ts         # POST — Claude regenerates one section
    industries/route.ts         # GET/POST/PATCH/DELETE — JSON CRUD
    applications/route.ts       # POST — form submission
  globals.css                   # tokens + Tailwind layers + reveal keyframes
components/
  landing/
    Nav.tsx, Hero.tsx, ProblemPromise.tsx, Plan.tsx,
    SampleProfile.tsx, StatsBand.tsx, Testimonials.tsx,
    Apply.tsx, FAQ.tsx, Founder.tsx, Footer.tsx
  admin/
    Sidebar.tsx, IndustriesTable.tsx, GeneratorForm.tsx,
    EditForm.tsx, SectionRegenerator.tsx, SaveBar.tsx,
    ToggleSwitch.tsx, AccentPicker.tsx
  ui/
    Eyebrow.tsx, Reveal.tsx, Button.tsx, SectionHead.tsx
config/
  base.json                     # brand, founder, fixed copy
  industries/                   # one JSON per industry — published source of truth
    cpas.json, attorneys.json, fractional-cfos.json, business-coaches.json,
    ma-advisors.json, agile-consulting.json, marketing-agencies.json, exit-planning.json
  schema.ts                     # Zod schemas for base + industry
lib/
  config.ts                     # loadIndustry(slug), listIndustries(), saveIndustry()
  forms.ts                      # submitApplication() — INTEGRATION POINT
  claude.ts                     # Anthropic API wrapper + generation prompts
  auth.ts                       # admin auth helpers
public/
  fonts/                        # Newsreader, Inter Tight, JetBrains Mono
  provider-playbook.pdf         # PLACEHOLDER — replace before launch
  logo.svg
```

## DESIGN SYSTEM — extract from `styles.css`

Every CSS variable in the prototype's `styles.css` becomes:
1. A CSS custom property in `app/globals.css`
2. A Tailwind theme extension in `tailwind.config.ts` (so `bg-paper`, `text-ink-700`, `border-rule` etc. work)

Key tokens (verify exact values from the file):
- Colors: `--blue-900`, `--blue-700`, `--green-600`, `--ink-900/700/500`, `--paper`, `--paper-2`, `--rule`
- Type: Newsreader (headlines, h1 fluid `clamp(40px, 5.5vw, 72px)`), Inter Tight (body 16/1.55), JetBrains Mono (eyebrows/captions, 11px uppercase 0.06–0.14em tracking)
- Spacing: container 1240px max, side padding 32px (22 mobile), section padding 120px desktop / 72px mobile
- Radii: sm 6px, md 10px, lg 18px
- Shadows: 3-tier `sh-1/2/3` using `rgba(15, 52, 88, …)` for brand-tinted depth
- Hairlines: 0.5px `var(--rule)`, NOT 1px borders
- Motion: IntersectionObserver reveal — opacity 0→1, translateY 14px→0, 700ms `cubic-bezier(.2,.7,.2,1)`. Respect `prefers-reduced-motion`.

## LANDING PAGE — SECTION ORDER (each toggleable per industry)
1. **Hero** — eyebrow, h1 (with `<em>` italic phrase), subhead, primary + secondary CTA, layered "sample listing" peek card on the right
2. **Problem → Promise** (combined section) — 4 villain cards in a tight strip, then "Here's what changes" success vision
3. **Plan** — 3 horizontal steps with connecting rule, big serif numerals
4. **Sample Profile** — browser-chromed card showing what the listing looks like
5. **Stats Band** (dark) — 3 oversized stats, industry-variant
6. **Testimonials** — auto-hides if `testimonials: []`
7. **Founder** — auto-hides if `showFounder: false`
8. **Apply + FAQ** — 2-col: form left, compact 4-question FAQ accordion right
9. **Footer** — single line: brand, link to main site, contact

A persistent **"Visit main site →"** link sits in the top-right of the nav, pointing to `https://findabusinesspro.com`.

## INDUSTRY CONFIG SCHEMA (Zod)

```ts
// config/schema.ts
import { z } from "zod";

export const industrySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  industry: z.string(),
  industryShort: z.string(),
  industryPlural: z.string(),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string().optional(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),  // may contain <em>...</em>
    subhead: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string(),
    heroImage: z.string().optional(),
    heroImageCaption: z.string(),
  }),
  problem: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    villains: z.array(z.object({ t: z.string(), b: z.string() })).length(4),
  }),
  promise: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
  }),
  plan: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    steps: z.array(z.object({ title: z.string(), body: z.string() })).length(3),
  }),
  profile: z.object({
    name: z.string(), role: z.string(), city: z.string(),
    tagline: z.string(),
    specialties: z.array(z.string()).min(3).max(6),
    stats: z.array(z.object({ v: z.string(), l: z.string() })).length(3),
    photo: z.string().optional(),
  }),
  statsBand: z.array(z.object({ value: z.string(), label: z.string() })).length(3).optional(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).min(4).max(6),
  testimonials: z.array(z.object({
    quote: z.string(), name: z.string(), role: z.string(), company: z.string().optional(),
  })).default([]),
  sections: z.object({
    hero: z.boolean(),
    problemPromise: z.boolean(),
    plan: z.boolean(),
    sampleProfile: z.boolean(),
    statsBand: z.boolean(),
    testimonials: z.boolean(),
    founder: z.boolean(),
    apply: z.boolean(),
  }),
  showFounder: z.boolean().default(false),
  accent: z.enum(["navy", "midnight", "ink", "forest"]).default("navy"),
});

export const baseSchema = z.object({
  brand: z.object({
    name: z.string(), parentUrl: z.string().url(), phone: z.string(),
  }),
  founder: z.object({
    name: z.string(), title: z.string(), bio: z.string(), photoCaption: z.string(),
  }),
});
```

**Build must fail if any config is malformed.** Validate at build time in `lib/config.ts`.

## STATIC GENERATION

`app/[industry]/page.tsx`:
- `generateStaticParams()` returns slugs from `config/industries/*.json`
- `generateMetadata()` reads the `seo` block
- Renders sections in order, gated by `config.sections[name]`
- Injects JSON-LD `Organization` + `Service` schema per page

## ADMIN — full spec (see `FABP Admin Preview.html` for visual reference)

**Auth gate:** wrap `/admin/*` with NextAuth or a single-password middleware. Never ship admin without auth.

**Industries list (`/admin`):** table of all configs from `config/industries/*.json`, with status (Published/Draft via a `published: boolean` field per config), last-edited timestamp, and Edit/View/Publish actions. "✨ New industry" button → `/admin/new`.

**Generator (`/admin/new`):**
- Step 1: input industry name + optional notes
- POST to `/api/generate` with `{name, notes}`
- Server endpoint:
  - Loads `config/schema.ts`, `config/base.json`, and 1–2 existing configs as few-shot examples
  - Calls Anthropic API with system prompt: "You are drafting a StoryBrand landing-page config matching this Zod schema. Match the editorial tone of the example. Output valid JSON only."
  - Validates response with `industrySchema.parse()` — retry once on failure with the validation error appended to the prompt
  - Writes to `config/industries/{slug}.json` with `published: false`
  - Returns the new slug
- Redirects to `/admin/{slug}` with a "✨ AI-generated draft" badge

**Edit view (`/admin/[slug]`):**
- Form bound to the industry config, autosaving on blur (debounced 800ms) via PATCH to `/api/industries`
- Each section has a "✨ Regenerate" button → POST `/api/regenerate` with `{slug, section}` — Claude rewrites only that section, validated against the section's sub-schema before merge
- Section visibility toggles (the 8 booleans in `config.sections`) save in real time
- Accent picker (4 options) saves in real time
- Sticky save bar with: "Auto-saved · Xs ago" indicator + Preview / Save draft / Save & publish buttons
- Publish flips `published: true` and triggers a Vercel/Replit rebuild via webhook (or just a revalidate call if same-process)

## FORM HANDLING

`lib/forms.ts`:
```ts
export type ApplicationData = {
  name: string; email: string; phone?: string;
  profession: string; city: string;
  years?: string; website?: string; spend?: string; fit?: string;
  industrySlug: string; submittedAt: string;
};

export async function submitApplication(data: ApplicationData) {
  // INTEGRATION POINT — see TODO #2 below
  // Until decided: POST to /api/applications which logs to console + emails admin via Resend
}
```

Form is **2-step progressive** (5 fields → 4 fields). Server action submits.

## ACCESSIBILITY & SEO
- Semantic landmarks (header/main/footer/section + `aria-labelledby`)
- All interactive elements keyboard-accessible
- `prefers-reduced-motion` removes Reveal animation
- Per-industry `<title>` + `<meta description>` + Open Graph
- JSON-LD `Organization` + `Service` schema injected per page
- Sitemap auto-generated from industries
- `robots.txt` allows indexing in production, blocks staging

## REPLIT DEPLOYMENT
- `replit.nix` pinning Node 20 + pnpm
- `.replit` run command: `pnpm build && pnpm start`
- Secrets configured in Replit Secrets panel (NEVER committed): `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`
- Deploy to **staging URL first** — do not configure DNS for `invitation.findabusinesspro.com` until staging is signed off
- DNS plan: CNAME `invitation` → Replit deployment URL; Cloudflare/registrar SSL set to "Full"

## DELIVERY ORDER (build in this sequence)

Do not build out of order. Each step gates the next.

1. **Scaffold + design tokens + fonts** — verify warm off-white, hairlines, type pairing visually match `FABP Invitation Landing.html` before writing any sections
2. **One industry rendering statically** (`/cpas`) — get Hero + Problem→Promise + Plan + Apply working end-to-end
3. **Industry config loader + Zod validation** — build must fail on bad config
4. **Remaining 7 industries** — JSON only, zero code changes (proves the duplication contract)
5. **Form submission + email destination wired** (see TODO #2)
6. **Admin: auth + list + edit views** — CRUD on JSON files, no AI yet
7. **Admin: generator endpoint + Anthropic integration** — last, because it's the most expensive to iterate on
8. **Polish, Lighthouse, deploy to staging URL, hand back for review**

## ACCEPTANCE CRITERIA (test all 5 before saying "done")

- [ ] All 8 industry routes render statically (`/cpas`, `/attorneys`, `/fractional-cfos`, `/business-coaches`, `/ma-advisors`, `/agile-consulting`, `/marketing-agencies`, `/exit-planning`)
- [ ] Adding a 9th industry by adding ONE JSON file to `config/industries/` makes it appear at `/{slug}` after rebuild — zero code changes
- [ ] `/admin` requires auth. Logged in, "✨ New industry" → type a real industry name → real Claude API call generates a draft → edit it → click Publish → live within 60 seconds
- [ ] Form submission lands wherever it's wired (Resend / HubSpot / etc.) and shows a thank-you state
- [ ] Lighthouse: ≥95 Performance, ≥95 Accessibility, ≥95 SEO on the staging deploy

If any of those five fail, it's not done.

## OPEN DECISIONS — handle as `// TODO(decision):` comments in code

Owner has flagged these as undecided. Scaffold around them; surface clearly in code:

1. **Founder publish toggle per industry** — `showFounder` field exists; default `false`. Owner flips per industry when bio + photo are ready.
2. **Form destination** — Resend / HubSpot / GoHighLevel / Calendly. **Ask the owner before wiring.** Until then, log to console + email admin via Resend as a placeholder.
3. **Provider Playbook PDF** — `/public/provider-playbook.pdf` is a placeholder. Replace before launch.
4. **Testimonials** — `testimonials: []` ready in every config. Component auto-hides when empty. Populate when collected.
5. **Pricing language in FAQ** — current copy ("listing is free; brand voice interview qualifies for marketing services") needs legal review before launch.
6. **Real portraits + sample listing imagery** — placeholders are editorial striped frames. Swap when photos are available.
7. **Hero image per industry** — `hero.heroImage` field exists. Currently placeholder.
8. **Marketing Mayhem book module** — currently a single mention in the Guide / arc copy. Decide if it gets its own section or lead-magnet flow.

## THINGS THE PROTOTYPE FAKES — DO NOT SHIP THESE FAKED

The admin prototype fakes the AI calls so the owner could see the UX. In production:

- The "✨ Generate draft with Claude" button MUST hit the real Anthropic API server-side (not from the browser — never expose `ANTHROPIC_API_KEY` client-side). Validate the response with Zod. Persist only on success.
- "✨ Regenerate" buttons on each section MUST do the same, scoped to one section.
- "Auto-saved · just now" MUST be real — debounced PATCH writes to the JSON file (or DB later), with a real timestamp displayed.
- The form submission in the prototype is `console.log`. Wire to the real destination per TODO #2.
- The admin has no auth in the prototype. Add it before any URL goes live.

## RULES OF ENGAGEMENT

- **Match the prototype visually.** Editorial restraint. Hairlines. Newsreader italics in headlines. Mono captions. Warm off-white. If something looks "designy / generic Tailwind," it's wrong.
- **No new dependencies** beyond what's specified above without asking the owner first.
- **All copy comes from configs** — no hardcoded strings in landing components except UI labels (button text like "Submit", aria-labels, etc.)
- **Server-only secrets stay server-only.** `ANTHROPIC_API_KEY` never reaches the client. Verify by inspecting the production bundle.
- **Ask before assuming** on any of the 8 open decisions.
- **No console errors or warnings** in production build.

Build the staging deploy, then hand back the URL + any decisions you need from the owner.
````

---

That's the complete handoff. A few things worth knowing as you paste it in:

- It explicitly tells Claude Code **not to swap to Framer Motion or pull in random UI kits** — the most common ways agentic builders quietly drift from the prototype's aesthetic.
- It **gates the AI generator until last**, after the static pages and admin CRUD are working — so you don't burn API credits debugging UI bugs.
- It bakes in the **5-test acceptance gate** from my earlier message, so Claude Code can self-verify before saying "done."
- It calls out the **8 open decisions as `// TODO(decision):` comments** so they don't get silently filled in with guesses.

Hand it the four files plus this prompt and you should be in good shape. Good luck on the build.

