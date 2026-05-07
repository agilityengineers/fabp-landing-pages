import { MetadataRoute } from "next";
import { listIndustries } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://findabusinesspro.com";
  const industries = listIndustries().filter((i) => i.published);

  const industryUrls: MetadataRoute.Sitemap = industries.map((industry) => ({
    url: `${base}/${industry.slug}`,
    lastModified: industry.lastEdited ? new Date(industry.lastEdited) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...industryUrls,
  ];
}
