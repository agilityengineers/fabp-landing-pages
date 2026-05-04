// configs.jsx — slimmer industry data for landing page (8 industries)

const PARENT_URL = "https://www.findabusinesspro.com";

const INDUSTRY_BASE = {
  brand: { name: "Find a Business Pro", parentUrl: PARENT_URL, phone: "(855) 636-5800" },
  founder: {
    name: "Clarence Williams",
    title: "Founder, Find a Business Pro",
    bio: "I wrote Marketing Mayhem because I watched too many talented professionals burn out chasing the wrong leads. Find a Business Pro is the directory I wish existed when I was building my own practice — a place where the right buyers find the right experts, without the noise.",
    book: "Author of Marketing Mayhem",
    photoLabel: "FOUNDER · CHARLOTTE, NC",
  },
  sections: { hero: true, problemPromise: true, plan: true, apply: true },
};

// Unsplash photo URLs — editorial, on-brand for each profession
const IMG = {
  cpas: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80&auto=format&fit=crop",
  attorneys: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=900&q=80&auto=format&fit=crop",
  fractional_cfos: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80&auto=format&fit=crop",
  business_coaches: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=80&auto=format&fit=crop",
  ma_advisors: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=80&auto=format&fit=crop",
  agile_consulting: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&auto=format&fit=crop",
  marketing_agencies: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&q=80&auto=format&fit=crop",
  exit_planning: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&q=80&auto=format&fit=crop",
};

function makeIndustry({ key, slug, industry, short, headline, ctxLine, villains, promise, profile, faq, photoLabel }) {
  return {
    slug, industry, industryShort: short,
    seo: { title: `An Invitation for ${industry} — Find a Business Pro` },
    hero: {
      eyebrow: `An Invitation — for ${industry}`,
      headline,
      subhead: ctxLine,
      primaryCta: "Book a 15-min intro call",
      secondaryCta: "Provider Playbook",
      heroImage: IMG[key],
      heroPhotoLabel: photoLabel,
    },
    problem: {
      headline: "You didn't earn the credentials to become a marketer.",
      villains,
    },
    promise: {
      headline: promise.headline,
      stats: promise.stats,
    },
    plan: [
      { time: "Step 01", title: "Apply", body: "A 5-minute application. We screen for credentials, market, and category availability." },
      { time: "Step 02", title: "Brand voice interview", body: "A 45-minute senior client advisor-led conversation that shapes how your listing sounds and can be leveraged for marketing purposes." },
      { time: "Step 03", title: "Get listed & matched", body: "Your category-exclusive profile goes live. Buyer-intent inquiries route to you — not a queue." },
    ],
    profile,
    faq,
  };
}

const INDUSTRIES = {
  cpas: makeIndustry({
    key: "cpas", slug: "cpas", industry: "CPAs", short: "CPA",
    photoLabel: "CPA · CHARLOTTE, NC",
    headline: "Stop competing for attention. Start being <em>chosen</em>.",
    ctxLine: "A category-exclusive listing in the directory business owners search when they need a CPA they can trust — so qualified clients find you instead of the other way around.",
    villains: [
      { t: "Ad spend that disappears", b: "Google and LinkedIn budgets eaten by clicks that never become clients." },
      { t: "Invisible in a crowded market", b: "Generic listings flatten a decade of expertise into another row." },
      { t: "Race-to-the-bottom marketplaces", b: "Thumbtack-style platforms reward bid speed, not expertise." },
      { t: "Referrals that ghost", b: "Word-of-mouth tire-kickers who never sign." },
    ],
    promise: {
      headline: "Ninety days from chaos to a clear, qualified pipeline — focused on the clients you actually want.",
      stats: [
        { v: "$8.4k", l: "Avg. CPA engagement value" },
        { v: "1", l: "Per metro · exclusive" },
        { v: "90 days", l: "To first inbound" },
      ],
    },
    profile: { name: "M. Reeves, CPA", role: "Outsourced CFO + Tax Strategy", city: "Charlotte, NC", stats: [{ v: "12yr", l: "Practice" }, { v: "$3M+", l: "Avg. AGI" }, { v: "47", l: "Clients" }] },
    statsBand: [
      { v: "$8.4k", l: "Avg. CPA engagement value" },
      { v: "73%", l: "Of buyers research a CPA online before contacting" },
      { v: "1 / metro", l: "Category-exclusive listing" },
    ],
    sampleProfileExpanded: {
      headline: "This is what your listing looks like.",
      sub: "Editorial-grade. SEO-indexed. Linked from the parent directory's high-traffic pages. Buyer-intent search routes inquiries to your inbox — not a queue.",
      bullets: ["Custom written by our editorial team", "Schema-marked for buyer searches", "Linked from parent directory landing pages"],
    },
    testimonials: [],
    faq: [
      { q: "What does it cost to be listed?", a: "Listing is free. After applying, we run a Brand Voice Interview to determine fit. Optional marketing services are discussed only if it makes sense for your situation." },
      { q: "What does category exclusivity mean?", a: "One listed CPA per metro. When a buyer searches, your profile is the answer — not one of ten." },
      { q: "How qualified is the traffic?", a: "Visitors arrive via the parent directory's organic SEO and editorial content — buyer-intent searches by category and metro." },
      { q: "What happens after I apply?", a: "A 15-minute intro call to confirm fit, then the Brand Voice Interview. Listings typically go live within two weeks." },
    ],
  }),
  attorneys: makeIndustry({
    key: "attorneys", slug: "attorneys", industry: "Business Attorneys", short: "Attorney",
    photoLabel: "ATTORNEY · ATLANTA, GA",
    headline: "Be the first call, not the <em>third referral</em>.",
    ctxLine: "A category-exclusive listing in the directory business owners search when the stakes are legal — formations, contracts, exits, disputes.",
    villains: [
      { t: "Bar-compliant marketing is its own job", b: "Every channel has rules. Most outsourced marketers don't speak the language." },
      { t: "Invisible in a crowded market", b: "Avvo-style sites flatten you next to every J.D. with a profile." },
      { t: "Race-to-the-bottom marketplaces", b: "Lead-gen platforms commodify a considered hire." },
      { t: "Referrals that ghost", b: "Intros that book a consult, then disappear." },
    ],
    promise: {
      headline: "From reactive to chosen — by founders, COOs, and CFOs at the moments that matter.",
      stats: [{ v: "$22.5k", l: "Avg. annual engagement" }, { v: "1", l: "Per practice area, per metro" }, { v: "90 days", l: "To first inbound" }],
    },
    profile: { name: "J. Carrington, Esq.", role: "Business + M&A Counsel", city: "Atlanta, GA", stats: [{ v: "18yr", l: "Practice" }, { v: "120+", l: "Closed deals" }, { v: "$210M", l: "YTD volume" }] },
    statsBand: [
      { v: "$22.5k", l: "Avg. annual engagement" },
      { v: "68%", l: "Of business owners search online for counsel" },
      { v: "1 / metro", l: "Per practice area, per metro" },
    ],
    sampleProfileExpanded: { headline: "This is what your listing looks like.", sub: "Bar-compliant, editorial, SEO-indexed. Buyer-intent inquiries route directly — not into a queue.", bullets: ["Bar-compliant copy reviewed by editorial", "Schema-marked for legal searches", "Linked from parent directory"] },
    testimonials: [],
    faq: [
      { q: "What does it cost to be listed?", a: "Listing is free. After applying, we run a Brand Voice Interview to determine fit." },
      { q: "What does category exclusivity mean?", a: "One listed attorney per practice area, per metro." },
      { q: "How is this different from Avvo or Martindale?", a: "Those flatten every J.D. into a directory entry. We curate, vet, and position." },
      { q: "What happens after I apply?", a: "A 15-minute intro call, then a Brand Voice Interview. Listings typically go live within two weeks." },
    ],
  }),
  fractional_cfos: makeIndustry({
    key: "fractional_cfos", slug: "fractional-cfos", industry: "Fractional CFOs", short: "Fractional CFO",
    photoLabel: "FRACTIONAL CFO · AUSTIN, TX",
    headline: "Be matched to founders who already <em>know they need you</em>.",
    ctxLine: "A category-exclusive listing in the directory founders search when the books, the runway, or the raise demands a real CFO.",
    villains: [
      { t: "Ad channels built for SaaS, not strategic finance", b: "Per-click optimization for relationship work." },
      { t: "Invisible in a crowded market", b: "Generalist sites flatten a CFO into a bookkeeper." },
      { t: "Per-hour bidding wars", b: "Auctioning strategic time on transactional platforms." },
      { t: "Referrals that evaporate", b: "Founder-network intros that never close." },
    ],
    promise: {
      headline: "Where founders look at fundraises, restructures, and pre-exit moments — and find you.",
      stats: [{ v: "$48k", l: "Avg. annual engagement" }, { v: "1", l: "Per vertical, per metro" }, { v: "90 days", l: "To first inbound" }],
    },
    profile: { name: "A. Okafor, MBA", role: "Fractional CFO — Series A→C", city: "Austin, TX", stats: [{ v: "9yr", l: "CFO experience" }, { v: "$140M", l: "Capital raised" }, { v: "11", l: "Active" }] },
    statsBand: [
      { v: "$48k", l: "Avg. annual engagement" },
      { v: "3.2x", l: "More inbound vs. cold outreach" },
      { v: "1 / vertical", l: "Per vertical, per metro" },
    ],
    sampleProfileExpanded: { headline: "This is what your listing looks like.", sub: "Editorial. SEO-indexed. Linked from the parent directory's high-traffic founder content.", bullets: ["Custom written by editorial", "Schema-marked for founder searches", "Linked from parent landing pages"] },
    testimonials: [],
    faq: [
      { q: "What does it cost to be listed?", a: "Listing is free. After applying, we run a Brand Voice Interview." },
      { q: "Category exclusivity?", a: "One listed CFO per vertical, per metro." },
      { q: "Different from Toptal or Paro?", a: "Those auction your time. We curate considered hires." },
      { q: "After I apply?", a: "A 15-minute intro call, then a Brand Voice Interview." },
    ],
  }),
  business_coaches: makeIndustry({
    key: "business_coaches", slug: "business-coaches", industry: "Business Coaches", short: "Business Coach",
    photoLabel: "BUSINESS COACH · DENVER, CO",
    headline: "Be found by founders who are ready, <em>not just curious</em>.",
    ctxLine: "A category-exclusive listing inside the directory founders trust when they're ready to invest in real outside guidance.",
    villains: [
      { t: "Saturated, noisy channels", b: "LinkedIn-bro coaching has poisoned the well." },
      { t: "Invisible in a crowded market", b: "Generalist sites flatten a coach into a freelancer." },
      { t: "Per-session bidding", b: "Pricing for work measured in years." },
      { t: "Curiosity calls that never close", b: "Intros that ask for time but not commitment." },
    ],
    promise: {
      headline: "Where serious founders look for serious coaches — without the noise.",
      stats: [{ v: "$28k", l: "Avg. engagement value" }, { v: "1", l: "Per niche, per metro" }, { v: "90 days", l: "To first inbound" }],
    },
    profile: { name: "L. Park, PCC", role: "Executive + Founder Coach", city: "Denver, CO", stats: [{ v: "11yr", l: "Coaching" }, { v: "ICF-PCC", l: "Credential" }, { v: "9", l: "Active clients" }] },
    statsBand: [
      { v: "$28k", l: "Avg. engagement value" },
      { v: "82%", l: "Founders citing coaching as growth lever" },
      { v: "1 / niche", l: "Per niche, per metro" },
    ],
    sampleProfileExpanded: { headline: "This is what your listing looks like.", sub: "Editorial. SEO-indexed. Surfaced when serious founders search.", bullets: ["Custom written by editorial", "Credentials prominently displayed", "Linked from parent landing pages"] },
    testimonials: [],
    faq: [
      { q: "What does it cost to be listed?", a: "Listing is free. Brand Voice Interview determines fit." },
      { q: "Category exclusivity?", a: "One listed coach per niche, per metro." },
      { q: "Different from coaching marketplaces?", a: "Those auction time. We curate considered hires." },
      { q: "After I apply?", a: "A 15-minute intro call, then a Brand Voice Interview." },
    ],
  }),
  ma_advisors: makeIndustry({
    key: "ma_advisors", slug: "ma-advisors", industry: "M&A Advisors", short: "M&A Advisor",
    photoLabel: "M&A ADVISOR · DALLAS, TX",
    headline: "Be the advisor founders find <em>before the LOI lands</em>.",
    ctxLine: "A category-exclusive listing inside the directory founders search when the next conversation is the most important one.",
    villains: [
      { t: "Ad spend that misallocates", b: "Generic channels can't target the moment that matters." },
      { t: "Invisible in a crowded market", b: "Generalist sites flatten an M&A practice into a brokerage." },
      { t: "Commission-bait platforms", b: "Volume marketplaces attract the wrong sellers." },
      { t: "Referrals that arrive late", b: "Introduced after the LOI is signed." },
    ],
    promise: {
      headline: "Where founders look at the earliest exit signals — and find the right advisor first.",
      stats: [{ v: "$180k+", l: "Avg. retainer floor" }, { v: "1", l: "Per deal-size band" }, { v: "90 days", l: "To first inbound" }],
    },
    profile: { name: "R. Donovan", role: "M&A Advisor — Lower Mid-Market", city: "Dallas, TX", stats: [{ v: "22yr", l: "Practice" }, { v: "60+", l: "Deals" }, { v: "$1.2B", l: "Volume" }] },
    statsBand: [
      { v: "$180k+", l: "Avg. retainer floor" },
      { v: "6–18mo", l: "Founder research window" },
      { v: "1 / band", l: "Per deal-size band" },
    ],
    sampleProfileExpanded: { headline: "This is what your listing looks like.", sub: "Editorial. SEO-indexed. Found at the earliest exit signals.", bullets: ["Track record prominently displayed", "Schema-marked for M&A searches", "Linked from parent landing pages"] },
    testimonials: [],
    faq: [
      { q: "What does it cost to be listed?", a: "Listing is free. Brand Voice Interview determines fit." },
      { q: "Category exclusivity?", a: "One listed advisor per deal-size band, per metro." },
      { q: "Different from BizBuySell or Axial?", a: "Those are transaction marketplaces. We're a curated advisor directory." },
      { q: "After I apply?", a: "A 15-minute intro call, then a Brand Voice Interview." },
    ],
  }),
  agile_consulting: makeIndustry({
    key: "agile_consulting", slug: "agile-consulting", industry: "Agile Consultants", short: "Agile Consultant",
    photoLabel: "AGILE CONSULTANT · SEATTLE, WA",
    headline: "Be matched to teams ready to <em>actually change</em>.",
    ctxLine: "A category-exclusive listing in the directory leaders search when transformation has stopped meaning ceremony and started meaning outcomes.",
    villains: [
      { t: "Frameworks are commodities", b: "Generic 'transformation' searches surface the loudest." },
      { t: "Invisible in a crowded market", b: "Generalist sites flatten a senior coach into a Scrum Master listing." },
      { t: "Day-rate auctions", b: "Bidding on outcome work as if it were inputs." },
      { t: "POCs that never close", b: "Pilots that demo well and never become contracts." },
    ],
    promise: {
      headline: "Where leaders look when ceremony has run its course — and outcomes are the only metric.",
      stats: [{ v: "$36k", l: "Avg. monthly engagement" }, { v: "1", l: "Per niche, per metro" }, { v: "90 days", l: "To first inbound" }],
    },
    profile: { name: "S. Iyer", role: "Agile + Operating Model Consultant", city: "Seattle, WA", stats: [{ v: "14yr", l: "Practice" }, { v: "30+", l: "Engagements" }, { v: "F500", l: "Roster" }] },
    statsBand: [
      { v: "$36k/mo", l: "Avg. monthly engagement" },
      { v: "4.1x", l: "More qualified inbound vs. RFPs" },
      { v: "1 / niche", l: "Per niche, per metro" },
    ],
    sampleProfileExpanded: { headline: "This is what your listing looks like.", sub: "Editorial. Outcome-focused. SEO-indexed.", bullets: ["Outcomes prominently displayed", "Schema-marked for buyer searches", "Linked from parent landing pages"] },
    testimonials: [],
    faq: [
      { q: "Cost?", a: "Listing is free. Brand Voice Interview determines fit." },
      { q: "Category exclusivity?", a: "One listed consultant per niche, per metro." },
      { q: "Different from Toptal Enterprise?", a: "We curate, position, and amplify — not auction." },
      { q: "After I apply?", a: "A 15-minute intro call, then a Brand Voice Interview." },
    ],
  }),
  marketing_agencies: makeIndustry({
    key: "marketing_agencies", slug: "marketing-agencies", industry: "Marketing Agencies", short: "Agency",
    photoLabel: "MARKETING AGENCY · NASHVILLE, TN",
    headline: "Be found by founders who already <em>value what you do</em>.",
    ctxLine: "A category-exclusive listing in the directory business owners search when they're ready to stop running marketing themselves.",
    villains: [
      { t: "Channels you sold to clients selling against you", b: "Paid search inflated past viability for your own pipeline." },
      { t: "Invisible in a crowded market", b: "Clutch-style sites turn agencies into a star-rating commodity." },
      { t: "RFP volume games", b: "Platforms reward proposal volume, not work quality." },
      { t: "Warm intros that go cold", b: "By the second meeting." },
    ],
    promise: {
      headline: "Where founders search when they're done DIY-ing it — and you're the considered choice.",
      stats: [{ v: "$120k+", l: "Avg. annual retainer" }, { v: "1", l: "Per discipline, per metro" }, { v: "90 days", l: "To first inbound" }],
    },
    profile: { name: "Field Notes Studio", role: "Brand + Demand Agency", city: "Nashville, TN", stats: [{ v: "8yr", l: "In market" }, { v: "12", l: "Retainers" }, { v: "B2B", l: "Sole focus" }] },
    statsBand: [
      { v: "$120k+", l: "Avg. annual retainer" },
      { v: "5x", l: "More inbound vs. RFP volume games" },
      { v: "1 / discipline", l: "Per discipline, per metro" },
    ],
    sampleProfileExpanded: { headline: "This is what your listing looks like.", sub: "Editorial. Case-led. SEO-indexed.", bullets: ["Case studies prominently displayed", "Schema-marked for buyer searches", "Linked from parent landing pages"] },
    testimonials: [],
    faq: [
      { q: "Cost?", a: "Listing is free. Brand Voice Interview determines fit." },
      { q: "Category exclusivity?", a: "One listed agency per discipline, per metro." },
      { q: "Different from Clutch?", a: "We curate, position, and amplify — not aggregate." },
      { q: "After I apply?", a: "A 15-minute intro call, then a Brand Voice Interview." },
    ],
  }),
  exit_planning: makeIndustry({
    key: "exit_planning", slug: "exit-planning", industry: "Business Exit Planners", short: "Exit Planner",
    photoLabel: "EXIT PLANNER · PHOENIX, AZ",
    headline: "Be found at the start of the exit — <em>not the end</em>.",
    ctxLine: "A category-exclusive listing in the directory founders search when 'eventually' becomes 'soon.'",
    villains: [
      { t: "Ad spend that misses the moment", b: "Channels can't target the founder whose CFO just floated the question." },
      { t: "Invisible in a crowded market", b: "Generalist sites flatten exit planning into 'business consulting.'" },
      { t: "Per-engagement bidding", b: "For multi-year work measured in valuation gain." },
      { t: "Referrals that arrive late", b: "After the founder has already chosen poorly." },
    ],
    promise: {
      headline: "Where founders look at the earliest exit signals — and find a planner before they need one.",
      stats: [{ v: "$90k+", l: "Avg. annual engagement" }, { v: "1", l: "Per industry, per metro" }, { v: "90 days", l: "To first inbound" }],
    },
    profile: { name: "T. Halberstam, CEPA", role: "Exit + Succession Planner", city: "Phoenix, AZ", stats: [{ v: "16yr", l: "Practice" }, { v: "CEPA", l: "Credential" }, { v: "40+", l: "Engagements" }] },
    statsBand: [
      { v: "$90k+", l: "Avg. annual engagement" },
      { v: "2–5yr", l: "Founder runway to exit" },
      { v: "1 / industry", l: "Per industry, per metro" },
    ],
    sampleProfileExpanded: { headline: "This is what your listing looks like.", sub: "Editorial. SEO-indexed. Found at the earliest exit signals.", bullets: ["Credentials prominently displayed", "Schema-marked for exit searches", "Linked from parent landing pages"] },
    testimonials: [],
    faq: [
      { q: "Cost?", a: "Listing is free. Brand Voice Interview determines fit." },
      { q: "Category exclusivity?", a: "One listed planner per industry, per metro." },
      { q: "Traffic quality?", a: "Founder-intent visitors via parent directory SEO and editorial." },
      { q: "After I apply?", a: "A 15-minute intro call, then a Brand Voice Interview." },
    ],
  }),
};

Object.assign(window, { INDUSTRY_BASE, INDUSTRIES, PARENT_URL });
