import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Industry } from "@/config/schema";

const MODEL = "claude-opus-4-7";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const playbookSlotsSchema = z.object({
  coverTagline: z.string().min(40).max(280),
  letterIntroParagraph: z.string().min(120).max(800),
  villains: z
    .array(
      z.object({
        title: z.string().min(8).max(120),
        body: z.string().min(80).max(600),
      }),
    )
    .length(4),
  pillarReputationWhy: z.string().min(120).max(700),
  pillarSocialWhy: z.string().min(120).max(700),
  pillarFunnelsWhy: z.string().min(120).max(700),
  pillarPaidWhy: z.string().min(120).max(700),
});

export type PlaybookSlots = z.infer<typeof playbookSlotsSchema>;

const SYSTEM_PROMPT = `You are writing per-industry copy for the Find a Business Pro Provider Playbook — a premium lead-magnet PDF in the voice of Clarence Williams, author of "Marketing Mayhem".

The playbook is a fixed 8-section template. Most of it stays the same across industries. You are filling SEVEN content slots with industry-specific prose that slots into the master template.

Voice rules — non-negotiable:
- Conversational, direct second-person address ("you", "your"). Plainspoken.
- Anti-hype, problem-first. Name the pain before promising the fix.
- No exclamation marks. Use em-dashes for rhythm.
- Use contractions ("you're", "didn't"). Sound like a person, not a brochure.
- Short sentences mixed with one longer one. Reading rhythm matters.
- Permission-giving and a touch iconoclastic ("Everyone's got the secret sauce. And most of them are full of crap.")
- Never use the word "leverage" or "synergy" or "solutions". Never use "in today's fast-paced world".

Signature framings used elsewhere in the playbook (echo this voice; don't quote them verbatim):
- "You didn't earn your credentials to become a marketer."
- "A well-credentialed secret."
- "The race you don't want to win."
- "Marketing doesn't have to be mayhem."
- "Foundation Builder / Visibility Builder / Authority Builder."

Output: a single JSON object matching the schema exactly. No markdown fences. No commentary. Just the JSON.`;

const FEW_SHOT_INDUSTRY = "Business Services Professionals";
const FEW_SHOT: PlaybookSlots = {
  coverTagline:
    "A 30-minute blueprint for the business services professional who is ready to be the recognized expert in their market — and stop competing for attention.",
  letterIntroParagraph:
    "You're a professional. A CPA. An M&A advisor. A business consultant. A fractional executive. An attorney. Whatever the title, you've spent years — maybe decades — building a craft. The credentials, the expertise, the case files, the war stories. You earned all of it. And then somebody told you that being good at your job wasn't enough anymore. That you also had to be a marketer. A content creator. A brand. A personality. And that if you weren't, the business owners who needed you would never find you.",
  villains: [
    {
      title: "You're spending money on ads that disappear.",
      body: "Google. LinkedIn. Maybe Facebook because someone said you should. The clicks come, the budget goes, and at the end of the month you can't draw a clean line from any of it to a single signed engagement.",
    },
    {
      title: "You're invisible in a market that's getting louder.",
      body: "Your credentials are real. Your experience is deep. But on a search results page, your listing looks like every other listing. Twelve years of expertise gets flattened into another row.",
    },
    {
      title: "You're losing to platforms that reward bid speed, not expertise.",
      body: "Thumbtack-style marketplaces have trained business owners to expect five quotes in an hour. The race goes to whoever responds fastest, not whoever serves them best. That's a race you don't want to win.",
    },
    {
      title: "Your referrals are ghosting you.",
      body: "The introduction lands in your inbox. You send your standard reply. You follow up. Silence. Word-of-mouth used to mean a warm lead with intent. Now it often means a tire-kicker who's also asking three other people.",
    },
  ],
  pillarReputationWhy:
    "A business owner shopping for a CPA, an M&A advisor, or a consultant is not buying a product. They're buying judgment. They're handing you their books, their deal, or their next strategic decision. Before they do that, they will Google you. They will read your reviews. They will check your profile. They will ask their network. If any of those signals are weak, you don't get the call.",
  pillarSocialWhy:
    "Your sales cycle is long. A business owner who needs you may not need you for six months, a year, or two years. Social media is the engine that keeps you in their orbit for that entire window without requiring you to chase them.",
  pillarFunnelsWhy:
    "A great reputation and a strong social presence will drive traffic to your site. If your site is a brochure with a contact form at the bottom, you'll lose 90 percent of that traffic. Your funnel is the system that captures the people who aren't ready to book yet, nurtures them, and brings them back when they are.",
  pillarPaidWhy:
    "The professionals who dominate their local market over the long run almost always have a paid traffic engine running underneath their organic presence. It's how they show up at the top of search when a buyer is in-market today, not someday.",
};

function buildUserPrompt(industry: Industry, notes: string): string {
  const industryName = industry.industry;
  const industryShort = industry.industryShort;

  return `Write the seven industry-specific slots for the Provider Playbook for the following industry.

INDUSTRY: ${industryName}
SHORT NAME: ${industryShort}
${notes ? `\nADDITIONAL CONTEXT FROM ADMIN:\n${notes}\n` : ""}
The landing page already establishes these villains for this profession (use them as truth, do not contradict — but you may sharpen the language for the playbook):
${industry.problem.villains.map((v, i) => `  ${i + 1}. ${v.t} — ${v.b}`).join("\n")}

Promise framing established for this industry:
  ${industry.promise.headline}

Here is a complete example of all seven slots, written for the "${FEW_SHOT_INDUSTRY}" industry. Match its voice, length, and rhythm exactly. Adapt the substance for ${industryName}.

EXAMPLE FOR "${FEW_SHOT_INDUSTRY}":
${JSON.stringify(FEW_SHOT, null, 2)}

Now write the same seven slots for "${industryName}". Use industry-specific examples, platforms, and pain points where relevant — but keep the structural framing identical (each villain has a punchy declarative title and a 2–3 sentence body; each "Why it matters specifically for you" pillar passage is 3–4 sentences and answers why this pillar lands harder for THIS industry than others).

Output ONLY the JSON object. No fences. No prose.`;
}

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "");
}

export async function generatePlaybookSlots(
  industry: Industry,
  notes: string,
): Promise<PlaybookSlots> {
  const client = getClient();
  const userPrompt = buildUserPrompt(industry, notes);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userPrompt },
        ...(attempt > 0 && lastError
          ? ([
              {
                role: "assistant" as const,
                content: "Previous response failed validation.",
              },
              {
                role: "user" as const,
                content: `That output failed validation: ${
                  lastError instanceof Error ? lastError.message : String(lastError)
                }. Try again. Output ONLY valid JSON matching the schema.`,
              },
            ] as const)
          : []),
      ],
    });

    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      lastError = new Error("Anthropic returned no text content");
      continue;
    }

    try {
      const json = JSON.parse(stripFences(block.text));
      return playbookSlotsSchema.parse(json);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `Failed to generate valid playbook slots after 2 attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
