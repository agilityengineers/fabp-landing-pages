import type { Industry } from "@/config/schema";
import type { PlaybookSlots } from "@/lib/playbook";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(s: string): string {
  return s
    .split(/\n{2,}|(?<=\.)\s{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

const STYLES = `
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif;
    color: #15171b;
    font-size: 11pt;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    background: #ffffff;
  }
  .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0.85in 0.95in;
    page-break-after: always;
    break-after: page;
    position: relative;
  }
  .page:last-child { page-break-after: auto; break-after: auto; }
  .mono {
    font-family: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
    font-size: 8pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #6b7080;
  }
  .serif { font-family: 'Source Serif 4', Georgia, serif; }
  h1, h2, h3 { font-weight: 600; letter-spacing: -0.012em; margin: 0; }
  h1 { font-size: 38pt; line-height: 1.05; }
  h2 { font-size: 22pt; line-height: 1.18; margin-bottom: 14pt; }
  h3 { font-size: 14pt; line-height: 1.25; margin: 14pt 0 6pt; }
  p { margin: 0 0 9pt; }
  em { font-style: italic; color: #1a3a5c; }
  hr.rule { border: 0; border-top: 0.5pt solid #c8c2b6; margin: 18pt 0; }
  .accent { color: #1a3a5c; }

  /* Cover */
  .cover {
    background: #f8f3e8;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover .brand-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .cover-title {
    font-size: 56pt;
    line-height: 0.98;
    letter-spacing: -0.02em;
    font-weight: 600;
    margin: 0.3in 0 18pt;
  }
  .cover-tagline {
    font-size: 14pt;
    line-height: 1.45;
    max-width: 5.4in;
    color: #2a2d35;
  }
  .cover-byline {
    border-top: 0.5pt solid #15171b;
    padding-top: 14pt;
    font-size: 10pt;
    color: #2a2d35;
  }
  .cover-byline .author {
    font-size: 13pt;
    margin: 4pt 0;
    color: #15171b;
  }

  /* Section header */
  .section-eyebrow {
    margin-bottom: 6pt;
    color: #1a3a5c;
  }
  .lede {
    font-size: 13pt;
    line-height: 1.5;
    margin-bottom: 14pt;
    color: #2a2d35;
  }

  /* Pull quote */
  .pullquote {
    font-family: 'Source Serif 4', Georgia, serif;
    font-style: italic;
    font-size: 14pt;
    line-height: 1.4;
    padding: 14pt 18pt;
    border-left: 2pt solid #1a3a5c;
    margin: 16pt 0;
    color: #2a2d35;
  }
  .pullquote .attr {
    display: block;
    font-style: normal;
    font-size: 9pt;
    margin-top: 8pt;
    color: #6b7080;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  /* Villain blocks */
  .villain { margin-bottom: 14pt; }
  .villain h3 {
    font-size: 13pt;
    margin: 0 0 4pt;
    color: #15171b;
  }
  .villain p { margin: 0; color: #2a2d35; }

  /* Assessment table */
  table.assess {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 10pt;
  }
  table.assess th, table.assess td {
    text-align: left;
    padding: 7pt 9pt;
    border-bottom: 0.5pt solid #d6d0c2;
    vertical-align: top;
  }
  table.assess th {
    background: #f8f3e8;
    font-weight: 600;
    font-size: 8.5pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6b7080;
  }
  table.assess td.dim {
    width: 1.6in;
    font-weight: 600;
    color: #1a3a5c;
  }
  table.assess td.score {
    width: 0.7in;
    font-family: 'IBM Plex Mono', monospace;
    text-align: center;
    color: #6b7080;
  }

  /* Stage table */
  table.stages {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 10.5pt;
  }
  table.stages td {
    padding: 9pt 10pt;
    border-bottom: 0.5pt solid #d6d0c2;
    vertical-align: top;
  }
  table.stages td.range {
    width: 0.9in;
    font-family: 'IBM Plex Mono', monospace;
    color: #1a3a5c;
  }
  table.stages td.stage {
    width: 1.6in;
    font-weight: 600;
  }

  /* Pillar header */
  .pillar-h {
    margin-top: 14pt;
    padding-top: 14pt;
    border-top: 0.5pt solid #c8c2b6;
  }
  .pillar-num {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #1a3a5c;
    margin-bottom: 4pt;
  }
  .pillar-h h3 {
    font-size: 18pt;
    margin: 0 0 8pt;
  }
  .pillar-block { margin-bottom: 8pt; }
  .pillar-block .label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8.5pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6b7080;
    margin: 8pt 0 3pt;
  }
  .stagenote {
    background: #f8f3e8;
    padding: 9pt 12pt;
    margin-top: 10pt;
    font-size: 10.5pt;
    line-height: 1.5;
    border-left: 2pt solid #1a3a5c;
  }
  .stagenote .label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #1a3a5c;
    margin-bottom: 2pt;
  }
  ol.three { padding-left: 18pt; margin: 6pt 0; }
  ol.three li { margin-bottom: 4pt; }

  /* Phase blocks */
  .phase { margin-bottom: 14pt; }
  .phase h3 {
    font-size: 14pt;
    color: #1a3a5c;
    margin-bottom: 4pt;
  }
  .phase ul { margin: 4pt 0; padding-left: 18pt; }
  .phase li { margin-bottom: 3pt; }

  /* Worksheet */
  .worksheet { font-size: 11pt; line-height: 1.7; }
  .worksheet .blank { display: inline-block; min-width: 2in; border-bottom: 0.5pt solid #15171b; }
  .worksheet .longblank {
    display: block;
    height: 0.6in;
    border-bottom: 0.5pt solid #15171b;
    margin: 4pt 0 12pt;
  }
  .worksheet h3 { margin-top: 14pt; }
  .checkbox { display: inline-block; width: 9pt; height: 9pt; border: 0.5pt solid #15171b; margin-right: 4pt; vertical-align: middle; }

  /* Steps */
  .step { margin-bottom: 16pt; }
  .step h3 { font-size: 14pt; margin-bottom: 4pt; }
  .step .url {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10pt;
    color: #1a3a5c;
  }

  /* Footer-ish on pages */
  .pagefoot {
    position: absolute;
    left: 0.95in;
    right: 0.95in;
    bottom: 0.5in;
    display: flex;
    justify-content: space-between;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.5pt;
    letter-spacing: 0.12em;
    color: #9a9a9a;
    text-transform: uppercase;
  }
`;

interface BuildOpts {
  industry: Industry;
  slots: PlaybookSlots;
  authorName?: string;
  brandPhone?: string;
}

export function buildPlaybookHtml({
  industry,
  slots,
  authorName = "Clarence Williams",
}: BuildOpts): string {
  const tagline = escapeHtml(slots.coverTagline);
  const letterIntro = paragraphs(slots.letterIntroParagraph);
  const villains = slots.villains
    .map(
      (v) => `
      <div class="villain">
        <h3>${escapeHtml(v.title)}</h3>
        ${paragraphs(v.body)}
      </div>`,
    )
    .join("");

  const industryNamePlural = industry.industryPlural ?? industry.industry;
  const industryDisplay = escapeHtml(industry.industry);
  const industryShort = escapeHtml(industry.industryShort);
  const slugFoot = escapeHtml(industry.slug.toUpperCase());

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Provider Playbook · ${industryDisplay}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>${STYLES}</style>
</head>
<body>

<!-- Cover -->
<section class="page cover">
  <div>
    <div class="brand-line">
      <div class="mono">Find a Business Pro</div>
      <div class="mono">Provider Playbook</div>
    </div>
    <div class="mono" style="margin-top:6pt;">${escapeHtml(industryNamePlural)}</div>
    <h1 class="cover-title">From Generalist <em>to</em> Go-To.</h1>
    <p class="cover-tagline">${tagline}</p>
  </div>
  <div class="cover-byline">
    <div class="mono">Built on the framework from</div>
    <div class="author serif">Marketing Mayhem</div>
    <div>by ${escapeHtml(authorName)}</div>
    <div class="mono" style="margin-top:8pt;">findabusinesspro.com  ·  brand-voice-interview.com</div>
  </div>
</section>

<!-- Letter -->
<section class="page">
  <div class="mono section-eyebrow">A letter from ${escapeHtml(authorName.split(" ")[0])}</div>
  <h2 class="serif">Why this exists, and how to use it.</h2>
  <p>If you bought this playbook with a credit card, I'd refund it. You didn't pay anything for it, so I won't. But I want you to read it like you did, because the next 30 minutes will save you the next 12 months.</p>
  ${letterIntro}
  <p>They were right about one thing: the market changed. They were wrong about almost everything else.</p>
  <p>This playbook is the strategic frame I wish every professional had before they wasted their first dollar on Google Ads or their first weekend on a website redesign. It's not the whole story — my book <em>Marketing Mayhem</em> is. But it's the blueprint. The map you tape to the wall before you start building.</p>
  <p>Read it in one sitting. Mark it up. Argue with it. Then come back to the worksheet at the end and write down what you're actually going to do.</p>
  <p>If you do that, this was worth your 30 minutes. If you don't, well — I told you I'd refund it.</p>
  <div class="pullquote">
    Marketing doesn't have to be mayhem. It feels that way because there are thousands of people out there selling you their one magic solution.
    <span class="attr">— ${escapeHtml(authorName)}</span>
  </div>
  <div class="pagefoot"><span>${slugFoot}</span><span>Find a Business Pro</span></div>
</section>

<!-- Section 1: Mayhem -->
<section class="page">
  <div class="mono section-eyebrow">Section 01</div>
  <h2 class="serif">The mayhem you're living in.</h2>
  <p class="lede">Let's name it before we fix it. If any of the following sounds like your last 90 days, you're in the right place.</p>
  ${villains}
  <h3>Here's what nobody wants to admit.</h3>
  <p>The marketing world has spun completely out of control. We've gone from a handful of clear strategies to thousands of tactics, platforms, tools, and so-called experts all screaming for your attention. Everyone's selling you something. Everyone's got the secret sauce. And most of them are full of crap.</p>
  <p>You didn't earn your credentials to become a marketer. You don't need to become one. You need a framework you can trust, and a sequence you can execute. That's all this playbook is.</p>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 01 · The mayhem</span></div>
</section>

<!-- Section 2: Thought leader -->
<section class="page">
  <div class="mono section-eyebrow">Section 02</div>
  <h2 class="serif">What "thought leader" actually means.</h2>
  <p>The phrase has been beaten to death by LinkedIn. Most people hear it and think of someone posting motivational quotes over sunset photography, racking up likes from strangers, and going viral on Tuesdays.</p>
  <p>That's not what we mean. That's not what your market needs. And it's certainly not how you're going to grow a serious practice.</p>

  <h3>A working definition.</h3>
  <p>A thought leader is the recognized go-to professional in a specific market, who generates content across multiple mediums, and is the obvious answer when a business owner needs help. Three parts. Each one matters.</p>
  <p><strong>Recognized</strong> means the market knows your name before they need you. Not after they Google their problem at midnight.</p>
  <p><strong>Go-to</strong> means when someone in your network is asked &ldquo;who should I talk to about ___?&rdquo;, your name comes up without effort.</p>
  <p><strong>In a specific market</strong> means a clear lane — a profession, a geography, an industry vertical, a deal size. You can't be the go-to for everyone.</p>
  <p><strong>Across multiple mediums</strong> means your expertise shows up where buyers already are. That's articles, video, podcasts, profiles, reviews, referrals, and yes, sometimes paid traffic. Not all of them at once, and not all on day one.</p>

  <h3>The gap most professionals never close.</h3>
  <p>Most ${escapeHtml(industryNamePlural.toLowerCase())} have everything they need to be a thought leader except three things:</p>
  <p><strong>Clarity</strong> — a sharp, defensible articulation of who they serve, what makes them different, and why someone should choose them over the other ten options.</p>
  <p><strong>Visibility</strong> — a system that puts that clarity in front of the right people, consistently, without burning their evenings.</p>
  <p><strong>Authority</strong> — a body of work (content, reviews, results) that proves the claim before the first conversation even starts.</p>
  <p>Without all three, you're a well-credentialed secret. The rest of this playbook is about closing those three gaps in the right order.</p>
  <div class="pullquote">
    You're not for everyone. You shouldn't try to be for everyone. The businesses that try to serve everybody end up serving nobody particularly well.
    <span class="attr">— Marketing Mayhem</span>
  </div>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 02 · Thought leader</span></div>
</section>

<!-- Section 3: Self-assessment -->
<section class="page">
  <div class="mono section-eyebrow">Section 03</div>
  <h2 class="serif">Where do you stand today?</h2>
  <p>Before you build a plan, you need an honest snapshot of where you are. The next two pages are a self-assessment across the five dimensions that determine whether ${escapeHtml(industryShort.toLowerCase())} becomes the recognized go-to in their market — or stays a well-kept secret.</p>
  <p>Score yourself 1 to 5 on each statement. Be ruthless. The point isn't to feel good. The point is to find the gap.</p>

  <h3>How to score</h3>
  <p><strong>1 — Not started.</strong> I've never done this, or I'm doing it badly.<br/>
  <strong>2 — Aware but inconsistent.</strong> I know I should, but it's haphazard.<br/>
  <strong>3 — Working on it.</strong> I've put real effort in but the system isn't humming yet.<br/>
  <strong>4 — Operational.</strong> It runs. It produces results. It could be sharper.<br/>
  <strong>5 — Best in market.</strong> This is a competitive advantage in my niche.</p>

  <table class="assess">
    <thead>
      <tr><th>Dimension</th><th>Statement</th><th>Score</th></tr>
    </thead>
    <tbody>
      <tr><td class="dim">Brand Voice &amp; Positioning</td><td>I can articulate, in one or two sentences, exactly who I serve, what I deliver, and why someone should choose me over my competition.</td><td class="score">____</td></tr>
      <tr><td class="dim">Brand Voice &amp; Positioning</td><td>If five clients described what I do, their answers would line up.</td><td class="score">____</td></tr>
      <tr><td class="dim">Brand Voice &amp; Positioning</td><td>My ideal client profile (ICP) is specific enough that I can name three businesses who fit it perfectly.</td><td class="score">____</td></tr>
      <tr><td class="dim">Reputation</td><td>I actively manage Google reviews and my Google Business Profile is fully optimized.</td><td class="score">____</td></tr>
      <tr><td class="dim">Reputation</td><td>My online citations (directories, listings, profiles) are accurate and consistent across the web.</td><td class="score">____</td></tr>
      <tr><td class="dim">Reputation</td><td>When a prospect Googles me before our first call, what they find reinforces my expertise.</td><td class="score">____</td></tr>
      <tr><td class="dim">Social Media</td><td>I publish content in at least one medium (written, video, audio) on a consistent schedule — not when I feel inspired.</td><td class="score">____</td></tr>
      <tr><td class="dim">Social Media</td><td>I have a clear editorial point of view that my market would recognize as mine.</td><td class="score">____</td></tr>
      <tr><td class="dim">Funnels &amp; Website</td><td>My website has a clear path from "stranger" to "booked call" — not just a contact form at the bottom.</td><td class="score">____</td></tr>
      <tr><td class="dim">Funnels &amp; Website</td><td>I have at least one lead magnet or resource that captures email addresses from people not yet ready to talk.</td><td class="score">____</td></tr>
      <tr><td class="dim">Funnels &amp; Website</td><td>I follow up with new leads on a defined cadence, not just "when I get to it."</td><td class="score">____</td></tr>
      <tr><td class="dim">Paid Traffic</td><td>I'm running paid ads with a clear, measured cost per qualified lead and a known return on spend.</td><td class="score">____</td></tr>
      <tr><td class="dim">Paid Traffic</td><td>My ads point to a landing page built for the specific offer — not my homepage.</td><td class="score">____</td></tr>
    </tbody>
  </table>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 03 · Self-assessment</span></div>
</section>

<section class="page">
  <h3>Total your score, then find your stage.</h3>
  <p>Add up your 13 scores. Maximum possible: 65.</p>
  <table class="stages">
    <tbody>
      <tr><td class="range">13–26</td><td class="stage">Foundation Builder</td><td>Brand Voice &amp; Positioning, then Reputation. Don't touch paid traffic yet.</td></tr>
      <tr><td class="range">27–45</td><td class="stage">Visibility Builder</td><td>Social Media and Funnels. Tighten your website's conversion path.</td></tr>
      <tr><td class="range">46–65</td><td class="stage">Authority Builder</td><td>Paid Traffic and content scaling. You're ready to dominate.</td></tr>
    </tbody>
  </table>
  <h3>If this assessment surfaced gaps you weren't expecting…</h3>
  <p>That's the most valuable thing this playbook can do for you in the first 10 minutes. The professionals who become the recognized go-to in their market all share one thing: they did this honest accounting first. The Brand Voice Interview at <em>brand-voice-interview.com</em> is designed to do exactly this kind of clarifying work — led by a senior client advisor, recorded, and turned into a reusable blueprint. We'll come back to it in the next section.</p>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 03 · Stages</span></div>
</section>

<!-- Section 4: Foundation -->
<section class="page">
  <div class="mono section-eyebrow">Section 04 · The foundation</div>
  <h2 class="serif">Your brand voice is the work that comes first.</h2>
  <p>Before reputation. Before social media. Before funnels. Before paid traffic. Before any of it.</p>
  <p>Think of your practice like a house. You wouldn't hang the pictures before you poured the foundation. But that's exactly what most professionals do with marketing — they buy the ad campaign before they've answered the question of who they actually are in the marketplace.</p>
  <p>Your brand voice is the foundation. It's not your logo. It's not your tagline. It's the clear, consistent answer to a handful of questions that, once answered, make every other marketing decision easier.</p>

  <h3>The five questions a brand voice has to answer.</h3>
  <p>If you can answer all five with confidence and specificity, you have a brand voice. If you can't, you don't — no matter how nice your website looks.</p>
  <p><strong>Mission.</strong> What do you exist to do for your clients? Not what you sell. What you change.</p>
  <p><strong>Vision.</strong> Where is your practice going? What does it look like in three to five years if everything goes right?</p>
  <p><strong>Values.</strong> What do you refuse to compromise on, even when it would be easier to go along?</p>
  <p><strong>Unique positioning.</strong> What makes you different from the next ten ${escapeHtml(industryShort.toLowerCase())} in your category? Not better. Different. Specifically and defensibly different.</p>
  <p><strong>Ideal client profile.</strong> Who, exactly, are you the right answer for? Industry, size, stage, situation, personality. The more specific, the better.</p>

  <h3>Try it now. Out loud. To yourself.</h3>
  <p>Pretend a referral source just asked, &ldquo;So who should I send to you?&rdquo; You have 30 seconds. Go.</p>
  <p>If your answer was a list of services, you don't have a brand voice yet. If your answer was a type of person in a specific situation getting a specific outcome, you do.</p>

  <h3>Why a recorded conversation beats a worksheet.</h3>
  <p>You can do this work alone. People do. They sit down with a notebook on a Saturday morning, and they write things down. And then six months later they look at what they wrote and realize it sounds like every other professional in their space.</p>
  <p>Here's why: the things that make you genuinely different rarely come out when you're writing. They come out when you're talking. The specific phrase you use with a client. The story you tell that makes them laugh. The objection you handle in a way nobody else does. The conviction in your voice when you talk about a particular kind of problem you've solved a hundred times.</p>
  <p>That nuance is your brand voice. And it's almost impossible to capture by yourself.</p>
  <div class="stagenote">
    <div class="label">The Brand Voice Interview</div>
    A live, recorded, 45-minute conversation led by a senior client advisor. We walk you through a structured set of questions designed to surface your mission, vision, values, unique positioning, and ICP — and we capture not just what you say, but how you say it. The recording becomes a reusable blueprint for everything that follows: your website copy, your social posts, your bio, your sales conversations, your content strategy. <strong>One conversation. Your voice. Infinite content.</strong> Schedule yours at brand-voice-interview.com.
  </div>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 04 · Foundation</span></div>
</section>

<!-- Section 5: Four pillars intro -->
<section class="page">
  <div class="mono section-eyebrow">Section 05</div>
  <h2 class="serif">The Four Pillars, in the order that actually works.</h2>
  <p>Once your brand voice is captured, you have a foundation. Now you build the house. The four pillars below are the frame, the walls, the roof, and the finish work — in that order.</p>
  <p>Most professionals try to do all four at once. That's how marketing budgets get vaporized. The professionals who become the recognized go-to in their market do them in sequence, and each pillar makes the next one stronger.</p>
  <table class="stages">
    <tbody>
      <tr><td class="range">01</td><td class="stage">Reputation</td><td>Builds trust before the first conversation. Foundation Builders, start here.</td></tr>
      <tr><td class="range">02</td><td class="stage">Social Media</td><td>Creates visibility and consistent presence. Visibility Builders, start here.</td></tr>
      <tr><td class="range">03</td><td class="stage">Funnels &amp; Website</td><td>Converts attention into booked calls. Visibility Builders, second.</td></tr>
      <tr><td class="range">04</td><td class="stage">Paid Traffic</td><td>Accelerates what's already working. Authority Builders, finally ready.</td></tr>
    </tbody>
  </table>

  <div class="pillar-h">
    <div class="pillar-num">Pillar 01</div>
    <h3>Reputation.</h3>
  </div>
  <div class="pillar-block">
    <div class="label">What it is</div>
    <p>Reputation is what the market believes about you before they ever speak with you. For ${escapeHtml(industryShort.toLowerCase())}, this is the most important pillar — because the buying decision in your category happens almost entirely in the trust phase.</p>
    <div class="label">Why it matters specifically for you</div>
    ${paragraphs(slots.pillarReputationWhy)}
    <div class="label">The gap most professionals have</div>
    <p>They treat reputation as something that happens to them — a passive byproduct of doing good work. It's not. It's a system. The professionals who win actively shape what shows up when their name is searched.</p>
    <div class="label">Three things to focus on first</div>
    <ol class="three">
      <li>Optimize your Google Business Profile completely. Not 80 percent. Completely. Photos, hours, services, posts, Q&amp;A, attributes.</li>
      <li>Build a review-generation system. Asking once is not a system. A repeatable, polite, post-engagement ask that runs every time — that's a system.</li>
      <li>Audit and fix your citations. Your name, address, and phone number must be identical across every directory the web knows about. Inconsistency is invisible to you and obvious to search engines.</li>
    </ol>
    <div class="stagenote">
      <div class="label">Stage note</div>
      If you scored as a Foundation Builder, this is your home for the first 30 days. Don't move on until your reputation systems are running. If you scored higher, audit your reputation first anyway — you'd be surprised how often "operational" turns out to be "invisible."
    </div>
  </div>
  <div class="pagefoot"><span>${slugFoot}</span><span>Pillar 01 · Reputation</span></div>
</section>

<!-- Pillars 2 & 3 -->
<section class="page">
  <div class="pillar-h" style="border-top:0;padding-top:0;margin-top:0;">
    <div class="pillar-num">Pillar 02</div>
    <h3>Social Media.</h3>
  </div>
  <div class="pillar-block">
    <div class="label">What it is</div>
    <p>Social media is how you stay visible and connected to your market between transactions. It's not where you close deals. It's where you stay front of mind so the right people remember you when the deal-shaped moment arrives.</p>
    <div class="label">Why it matters specifically for you</div>
    ${paragraphs(slots.pillarSocialWhy)}
    <div class="label">The gap most professionals have</div>
    <p>They post sporadically when they remember, on whatever platform feels easiest, with whatever content feels safe. The result is a feed that proves nothing about their expertise and inspires nothing in their audience. Inconsistency is the silent killer here — not bad content, just absent content.</p>
    <div class="label">Three things to focus on first</div>
    <ol class="three">
      <li>Pick one primary platform where your buyers actually spend time. For most ${escapeHtml(industryNamePlural.toLowerCase())}, that's LinkedIn. Don't try to be everywhere.</li>
      <li>Build a content rhythm you can sustain for 12 months. Twice a week is better than seven times for three weeks and then nothing.</li>
      <li>Have a recognizable point of view. Generic helpful tips disappear. A consistent perspective, repeated across content, builds authority.</li>
    </ol>
    <div class="stagenote">
      <div class="label">Stage note</div>
      Visibility Builders, this is the pillar that closes your gap. You have the foundation. Now you need to be seen, in your voice, on a schedule. Foundation Builders, don't skip ahead — a beautiful, consistent feed pointing at a confused brand is wasted effort.
    </div>
  </div>

  <div class="pillar-h">
    <div class="pillar-num">Pillar 03</div>
    <h3>Funnels &amp; Website.</h3>
  </div>
  <div class="pillar-block">
    <div class="label">What it is</div>
    <p>Your funnel is the path a stranger takes from "never heard of you" to "signed engagement." Your website is the most important section of that path — but it's a section, not the whole road.</p>
    <div class="label">Why it matters specifically for you</div>
    ${paragraphs(slots.pillarFunnelsWhy)}
    <div class="label">The gap most professionals have</div>
    <p>Their website is built like a printed brochure — here's who we are, here's what we do, here's a phone number. There's no lead magnet. No email capture. No follow-up sequence. The visitor either books a call or vanishes forever. Most vanish.</p>
    <div class="label">Three things to focus on first</div>
    <ol class="three">
      <li>Have one clear primary call to action on every page. "Book a call" or "Download the guide." Not both. Not five.</li>
      <li>Offer at least one valuable lead magnet — a guide, a checklist, an assessment — that captures email from visitors who aren't ready to talk.</li>
      <li>Build a follow-up sequence that runs automatically. Five to seven emails over two to three weeks, demonstrating expertise and inviting a conversation.</li>
    </ol>
    <div class="stagenote">
      <div class="label">Stage note</div>
      Visibility Builders, the funnel work happens in parallel with your social media work. The two pillars feed each other — social drives traffic, the funnel converts it. Authority Builders, audit your funnel before you scale paid spend, because paid traffic into a leaky funnel is the fastest way to spend a lot of money on nothing.
    </div>
  </div>
  <div class="pagefoot"><span>${slugFoot}</span><span>Pillars 02 &amp; 03</span></div>
</section>

<!-- Pillar 4 + Section 6 -->
<section class="page">
  <div class="pillar-h" style="border-top:0;padding-top:0;margin-top:0;">
    <div class="pillar-num">Pillar 04</div>
    <h3>Paid Traffic.</h3>
  </div>
  <div class="pillar-block">
    <div class="label">What it is</div>
    <p>Paid traffic is the accelerator. It's how you take a system that's already working organically and pour fuel on it. Done correctly, it's the fastest way to predictable pipeline. Done before the other three pillars are in place, it's the fastest way to set money on fire.</p>
    <div class="label">Why it matters specifically for you</div>
    ${paragraphs(slots.pillarPaidWhy)}
    <div class="label">The gap most professionals have</div>
    <p>They run paid traffic before they have a brand voice, a reputation system, a content presence, or a converting funnel. Then they pause it because "ads don't work for our industry." Ads work fine. The system underneath them didn't.</p>
    <div class="label">Three things to focus on first</div>
    <ol class="three">
      <li>Don't start until the first three pillars are operational. This is non-negotiable.</li>
      <li>Run small, measured tests with a clear cost-per-qualified-lead target before you scale anything.</li>
      <li>Send paid traffic to a dedicated landing page built for the offer — not your homepage. Ever.</li>
    </ol>
    <div class="stagenote">
      <div class="label">Stage note</div>
      Authority Builders, this is your pillar. Foundation and Visibility Builders — stay out of here for now. The math doesn't work until the rest is in place, and the temptation to skip ahead is the single most expensive mistake we see professionals make.
    </div>
  </div>
  <div class="pagefoot"><span>${slugFoot}</span><span>Pillar 04 · Paid traffic</span></div>
</section>

<!-- Section 6: 90-day blueprint -->
<section class="page">
  <div class="mono section-eyebrow">Section 06</div>
  <h2 class="serif">Your 90-day blueprint.</h2>
  <p>You don't need a 12-month plan. You need a 90-day plan you'll actually execute, and a system for reviewing it at the end of the quarter.</p>
  <p>The frame below is the strategic shape of your next 90 days, regardless of which stage you scored into. Foundation Builders will spend more time in Phase 1. Authority Builders will move faster through it. Everyone moves through the same sequence.</p>

  <div class="phase">
    <h3>Phase 1 — Days 1–30: Foundation.</h3>
    <ul>
      <li>Capture your brand voice. Schedule and complete the Brand Voice Interview.</li>
      <li>Audit and optimize your Google Business Profile.</li>
      <li>Fix your citations across the major directories.</li>
      <li>Build your review-generation system and put it on autopilot.</li>
    </ul>
    <p><em>By Day 30, your reputation should be a competitive advantage, not a liability.</em></p>
  </div>

  <div class="phase">
    <h3>Phase 2 — Days 31–60: Visibility &amp; Conversion.</h3>
    <ul>
      <li>Choose your primary social platform and commit to a content rhythm.</li>
      <li>Publish content built directly from your brand voice blueprint.</li>
      <li>Tighten your website's primary call to action and conversion path.</li>
      <li>Build and launch one lead magnet with an automated follow-up sequence.</li>
    </ul>
    <p><em>By Day 60, you should be visible to your market and converting traffic into qualified leads.</em></p>
  </div>

  <div class="phase">
    <h3>Phase 3 — Days 61–90: Acceleration.</h3>
    <ul>
      <li>Test paid traffic in a small, measured campaign.</li>
      <li>Identify what's working organically and amplify it with paid spend.</li>
      <li>Build a retargeting campaign that re-engages visitors and warm leads.</li>
      <li>Document your wins, baseline your metrics, and plan the next 90 days.</li>
    </ul>
    <p><em>By Day 90, you should have a system — not a campaign — that runs every quarter.</em></p>
  </div>

  <div class="pullquote">
    This roadmap only works if you do the work. Marketing isn't magic — it's consistent execution of the fundamentals.
    <span class="attr">— ${escapeHtml(authorName)}</span>
  </div>

  <h3>The honest question.</h3>
  <p>You've now seen the full picture. The diagnostic. The brand voice work. The four pillars. The 90-day arc. You can do this alone. Many professionals try.</p>
  <p>Or you can do it with a partner who has walked through this sequence with hundreds of professionals. Who runs the brand voice interview, audits the reputation systems, builds the funnel, and runs the paid traffic. So that you spend the next 90 days serving your clients — the thing you actually trained for — instead of building marketing infrastructure.</p>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 06 · 90-day blueprint</span></div>
</section>

<!-- Section 7: Worksheet -->
<section class="page worksheet">
  <div class="mono section-eyebrow">Section 07 · Worksheet</div>
  <h2 class="serif">Your personal action plan.</h2>
  <p>Print this page. Fill it in. Tape it where you'll see it tomorrow morning. The professionals who execute their 90-day plan are the ones who write it down.</p>

  <h3>My honest snapshot.</h3>
  <p>My total assessment score: <span class="blank">&nbsp;</span> out of 65</p>
  <p>My stage: &nbsp;<span class="checkbox"></span> Foundation Builder &nbsp;&nbsp; <span class="checkbox"></span> Visibility Builder &nbsp;&nbsp; <span class="checkbox"></span> Authority Builder</p>

  <h3>My three priorities for the next 90 days.</h3>
  <p>Based on my stage, the three things I'm going to focus on are:</p>
  <p>1. <span class="longblank"></span></p>
  <p>2. <span class="longblank"></span></p>
  <p>3. <span class="longblank"></span></p>

  <h3>My first 30-day commitment.</h3>
  <p>By the end of the next 30 days, I will have completed:</p>
  <p><span class="longblank"></span></p>
  <p>Hours per week I will commit to this work: <span class="blank">&nbsp;</span></p>

  <h3>My Brand Voice Interview is scheduled for:</h3>
  <p>Date: <span class="blank">&nbsp;</span> &nbsp;&nbsp; Time: <span class="blank">&nbsp;</span></p>
  <p class="mono">Schedule yours at brand-voice-interview.com.</p>

  <h3>My commitment.</h3>
  <p>I, <span class="blank">&nbsp;</span>, commit to executing this 90-day blueprint with the same seriousness I bring to my client work.</p>
  <p>Signature: <span class="blank">&nbsp;</span> &nbsp;&nbsp; Date: <span class="blank">&nbsp;</span></p>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 07 · Worksheet</span></div>
</section>

<!-- Section 8: Next steps -->
<section class="page">
  <div class="mono section-eyebrow">Section 08</div>
  <h2 class="serif">Your next three steps.</h2>
  <p>In order of impact. Pick the one that matches where you are right now — or do all three.</p>

  <div class="step">
    <h3>Step 1. Schedule your Brand Voice Interview.</h3>
    <p>This is the bridge between learning and doing. A live, recorded, 45-minute conversation that captures the foundation everything else is built on. There's no cost. There's no obligation. The output is a reusable blueprint that pays dividends for years.</p>
    <div class="url">brand-voice-interview.com</div>
  </div>

  <div class="step">
    <h3>Step 2. Get the book.</h3>
    <p>This playbook is the blueprint. <em>Marketing Mayhem</em> is the full instruction manual — every framework, every chapter, every story behind why marketing got this complicated and how to cut through it. If you want depth before you commit to a conversation, start there.</p>
    <div class="url">marketing-mayhem.com</div>
  </div>

  <div class="step">
    <h3>Step 3. Apply for your category-exclusive listing.</h3>
    <p>Find a Business Pro lists one premium professional per category, per metro. When a business owner searches your category in your market, your profile is the answer — not one of ten. Listings are first-come, first-served, and we don't compete with our own clients.</p>
    <div class="url">findabusinesspro.com</div>
  </div>

  <hr class="rule" />

  <div class="mono section-eyebrow">About</div>
  <h3>Find a Business Pro &amp; the Marketing Mayhem method.</h3>
  <p><strong>Find a Business Pro.</strong> A directory built around a simple idea: business owners shouldn't have to wade through ten generic listings to find a professional they can actually trust. We list one premium professional per category, per metro. When a buyer searches, they get an answer — not a queue.</p>
  <p><strong>The Marketing Mayhem method.</strong> Find a Business Pro is built on the framework from <em>Marketing Mayhem</em> by ${escapeHtml(authorName)} — the four-pillar, foundation-first approach to marketing that this playbook draws from. The method is simple to describe and rigorous to execute: build the foundation before you build the walls, build the walls before you put on the roof, and never confuse activity with progress.</p>
  <p class="mono">findabusinesspro.com  ·  brand-voice-interview.com  ·  marketing-mayhem.com</p>
  <div class="pagefoot"><span>${slugFoot}</span><span>Section 08 · Next steps</span></div>
</section>

</body>
</html>`;
}
