import fs from "fs";
import path from "path";
import { baseSchema, industrySchema } from "../config/schema";

const industriesDir = path.join(process.cwd(), "config", "industries");

// Validate base.json
const baseFilePath = path.join(process.cwd(), "config", "base.json");
let baseHasError = false;

try {
  const baseContent = fs.readFileSync(baseFilePath, "utf-8");
  const baseRaw = JSON.parse(baseContent);
  const baseResult = baseSchema.safeParse(baseRaw);
  if (baseResult.success) {
    console.log("OK    base.json");
  } else {
    baseHasError = true;
    console.error("FAIL  base.json:");
    for (const issue of baseResult.error.issues) {
      const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      console.error(`        ${fieldPath}: ${issue.message}`);
    }
  }
} catch (err) {
  baseHasError = true;
  console.error(`FAIL  base.json: failed to parse JSON — ${(err as Error).message}`);
}

const files = fs
  .readdirSync(industriesDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error("No industry JSON files found in config/industries/");
  process.exit(1);
}

let hasErrors = false;

for (const file of files) {
  const filePath = path.join(industriesDir, file);
  let raw: unknown;

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    raw = JSON.parse(content);
  } catch (err) {
    console.error(`FAIL  ${file}: failed to parse JSON — ${(err as Error).message}`);
    hasErrors = true;
    continue;
  }

  const result = industrySchema.safeParse(raw);
  if (result.success) {
    console.log(`OK    ${file}`);
  } else {
    hasErrors = true;
    console.error(`FAIL  ${file}:`);
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      console.error(`        ${fieldPath}: ${issue.message}`);
    }
  }
}

if (hasErrors || baseHasError) {
  console.error("\nValidation failed. Fix the errors above before deploying.");
  process.exit(1);
} else {
  console.log(`\nAll ${files.length} industry config(s) and base config are valid.`);
}
