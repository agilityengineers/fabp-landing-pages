import { z } from "zod";

export const statSchema = z.object({ v: z.string(), l: z.string() });

export const industrySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  professionId: z.number().int().positive(),
  industry: z.string(),
  industryShort: z.string(),
  industryPlural: z.string().optional(),
  published: z.boolean().default(false),
  lastEdited: z.string().optional(),

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
    heroImage: z.string().optional(),
    heroPhotoLabel: z.string(),
  }),

  problem: z.object({
    headline: z.string(),
    villains: z.array(z.object({ t: z.string(), b: z.string() })).length(4),
  }),

  promise: z.object({
    headline: z.string(),
    stats: z.array(statSchema).length(3),
  }),

  plan: z.array(
    z.object({ time: z.string(), title: z.string(), body: z.string() })
  ).length(3),

  profile: z.object({
    name: z.string(),
    role: z.string(),
    city: z.string(),
    stats: z.array(statSchema).length(3),
  }),

  statsBand: z.array(statSchema).length(3).optional(),

  faq: z.array(z.object({ q: z.string(), a: z.string() })).min(4).max(6),

  testimonials: z.array(
    z.object({
      quote: z.string(),
      name: z.string(),
      role: z.string(),
      company: z.string().optional(),
    })
  ).default([]),

  sections: z.object({
    hero: z.boolean(),
    problemPromise: z.boolean(),
    plan: z.boolean(),
    sampleProfile: z.boolean(),
    statsBand: z.boolean(),
    testimonials: z.boolean(),
    founder: z.boolean(),
    apply: z.boolean(),
    featuredOffer: z.boolean().default(false),
    aiAdvantage: z.boolean().default(false),
  }),

  featuredOffer: z
    .object({
      eyebrow: z.string(),
      headline: z.string(),
      body: z.string(),
      primaryCta: z.string(),
      secondaryCta: z.string(),
      basicSignupUrl: z.string().url().optional(),
      brandVoiceInterviewUrl: z.string().url().optional(),
    })
    .optional(),

  showFounder: z.boolean().default(false),
  accent: z.enum(["navy", "midnight", "ink", "forest"]).default("navy"),

  playbook: z
    .object({
      s3Key: z.string(),
      fileName: z.string(),
      updatedAt: z.string(),
      source: z.enum(["uploaded", "generated"]),
    })
    .optional(),
});

export const baseSchema = z.object({
  brand: z.object({
    name: z.string(),
    parentUrl: z.string().url(),
    phone: z.string(),
  }),
  founder: z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    book: z.string(),
    photoLabel: z.string(),
  }),
  links: z
    .object({
      bdBasicSignupUrl: z.string().url(),
      bdFeaturedSignupUrl: z.string().url(),
      brandVoiceInterviewUrl: z.string().url(),
    })
    .default({
      bdBasicSignupUrl: "https://www.findabusinesspro.com/signup?plan=basic",
      bdFeaturedSignupUrl: "https://www.findabusinesspro.com/signup?plan=featured",
      brandVoiceInterviewUrl: "https://brand-voice-interview.com/?ref=fabp",
    }),
});

export type Industry = z.infer<typeof industrySchema>;
export type Base = z.infer<typeof baseSchema>;
