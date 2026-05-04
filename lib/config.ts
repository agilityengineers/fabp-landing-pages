import fs from "fs";
import path from "path";
import { industrySchema, baseSchema, type Industry, type Base } from "@/config/schema";

const INDUSTRIES_DIR = path.join(process.cwd(), "config", "industries");
const BASE_FILE = path.join(process.cwd(), "config", "base.json");

export function loadBase(): Base {
  const raw = JSON.parse(fs.readFileSync(BASE_FILE, "utf-8"));
  return baseSchema.parse(raw);
}

export function saveBase(data: Base): void {
  const validated = baseSchema.parse(data);
  fs.writeFileSync(BASE_FILE, JSON.stringify(validated, null, 2), "utf-8");
}

export function loadIndustry(slug: string): Industry {
  const file = path.join(INDUSTRIES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Industry not found: ${slug}`);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return industrySchema.parse(raw);
}

export function listIndustries(): Industry[] {
  if (!fs.existsSync(INDUSTRIES_DIR)) return [];
  const files = fs.readdirSync(INDUSTRIES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(INDUSTRIES_DIR, f), "utf-8"));
    return industrySchema.parse(raw);
  });
}

export function listSlugs(): string[] {
  if (!fs.existsSync(INDUSTRIES_DIR)) return [];
  return fs
    .readdirSync(INDUSTRIES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

export function saveIndustry(slug: string, data: Industry): void {
  if (!fs.existsSync(INDUSTRIES_DIR)) {
    fs.mkdirSync(INDUSTRIES_DIR, { recursive: true });
  }
  const file = path.join(INDUSTRIES_DIR, `${slug}.json`);
  const withMeta = { ...data, slug, lastEdited: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(withMeta, null, 2), "utf-8");
}

export function deleteIndustry(slug: string): void {
  const file = path.join(INDUSTRIES_DIR, `${slug}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
