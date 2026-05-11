/**
 * One-time uploader for the default Provider Playbook PDF.
 *
 * Usage:
 *   npx tsx scripts/upload-default-playbook.ts <path/to/file.pdf>
 *
 * Requires AWS_REGION, AWS_S3_BUCKET, AWS_S3_PREFIX, AWS_ACCESS_KEY_ID,
 * AWS_SECRET_ACCESS_KEY in the environment (Replit Secrets in production).
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { uploadPlaybook, getDefaultPlaybookKey } from "../lib/s3";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: tsx scripts/upload-default-playbook.ts <pdf path>");
    process.exit(1);
  }
  const path = resolve(arg);
  const buffer = readFileSync(path);
  if (buffer.length === 0) {
    console.error(`File is empty: ${path}`);
    process.exit(1);
  }

  const key = getDefaultPlaybookKey();
  console.log(`Uploading ${path} (${buffer.length} bytes) to s3://${process.env.AWS_S3_BUCKET}/${key} ...`);
  await uploadPlaybook(key, buffer, "application/pdf");
  console.log(`Default playbook uploaded to ${key}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
