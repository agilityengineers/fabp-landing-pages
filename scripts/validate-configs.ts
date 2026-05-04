import fs from "fs";
import path from "path";
import { industrySchema } from "../config/schema";

const industriesDir = path.join(process.cwd(), "config", "industries");

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

if (hasErrors) {
  console.error("\nValidation failed. Fix the errors above before deploying.");
  process.exit(1);
} else {
  console.log(`\nAll ${files.length} industry config(s) are valid.`);
}
