import Anthropic from "@anthropic-ai/sdk";
import { industrySchema, type Industry } from "@/config/schema";
import { loadBase, listIndustries } from "@/lib/config";

const MODEL = "claude-opus-4-7";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `You are drafting StoryBrand landing-page configs for Find a Business Pro, a premium B2B directory that connects business owners with vetted service professionals (CPAs, attorneys, fractional CFOs, business coaches, M&A advisors, etc.).

Your output MUST be a single valid JSON object matching the schema exactly. No markdown fences. No explanation. Just the JSON.

Voice guidelines:
- Premium, editorial B2B. Not hype. Think Big-4 consultancy meets Inc. Magazine.
- Hero headline: one <em>...</em> italicized phrase that lands the insight
- "You didn't earn the credentials to become a marketer." is the fixed problem headline — do not change it
- Villains: real, specific marketing pains for this profession (ad spend, invisibility, commodification, low-intent leads)
- Promise headline: 90-day arc from chaos to clarity, specific to the profession
- Promise stats: 3 believable metrics (avg. engagement value, exclusivity, timeline)
- Plan: always exactly 3 steps — Apply → Brand Voice Interview → Get listed & matched
- FAQ: cover pricing (listing is free; Featured is also free for pros who complete the Brand Voice Interview), exclusivity, traffic quality, what happens after applying
- Tone: understated confidence. Short sentences. No exclamation marks.`;

function buildPrompt(name: string, notes: string, exampleConfig: Industry): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `Generate a complete landing-page config JSON for the profession: "${name}"
${notes ? `Additional context: ${notes}` : ""}

The slug should be: "${slug}"

Here is a complete example config to match in structure, tone, and depth:
${JSON.stringify(exampleConfig, null, 2)}

Output ONLY the JSON. Match every field exactly. Use the same sections defaults (hero, problemPromise, plan, apply all true; sampleProfile, statsBand, testimonials, founder all false). Set published: false. Set accent: "navy".`;
}

export async function generateIndustryConfig(
  name: string,
  notes: string
): Promise<Industry> {
  const client = getClient();

  // Use CPAs as the few-shot example
  const industries = listIndustries();
  const example = industries.find((i) => i.slug === "cpas") ?? industries[0];
  if (!example) throw new Error("No example industry found for few-shot generation");

  const prompt = buildPrompt(name, notes, example);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const extraInstruction =
      attempt > 0 && lastError
        ? `\n\nPrevious attempt failed validation: ${lastError.message}. Fix the issue and output valid JSON only.`
        : "";

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt + extraInstruction }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Expected text response from Claude");

    let text = content.text.trim();
    // Strip markdown fences if present
    text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    try {
      const parsed = JSON.parse(text);
      const validated = industrySchema.parse(parsed);
      return validated;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(`Generation failed after 2 attempts: ${lastError?.message}`);
}

export async function regenerateSection(
  industry: Industry,
  section: string
): Promise<Partial<Industry>> {
  const client = getClient();

  const sectionMap: Record<string, string> = {
    hero: "hero object",
    problem: "problem object (headline + 4 villains)",
    promise: "promise object (headline + 3 stats)",
    plan: "plan array (3 steps)",
    profile: "profile object",
    faq: "faq array",
  };

  const target = sectionMap[section];
  if (!target) throw new Error(`Unknown section: ${section}`);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Regenerate ONLY the "${section}" section for this industry config: ${industry.industry}.

Current full config for context:
${JSON.stringify(industry, null, 2)}

Output ONLY the ${target} as valid JSON. No wrapper. No explanation.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Expected text response");

  let text = content.text.trim();
  text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  return JSON.parse(text);
}
