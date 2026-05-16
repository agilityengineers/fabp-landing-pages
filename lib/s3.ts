import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

export function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }
  return bucket;
}

function getKeyPrefix(): string {
  const raw = process.env.AWS_S3_PREFIX ?? "";
  if (!raw) return "";
  return raw.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
}

export function buildPlaybookKey(suffix: string): string {
  const cleanSuffix = suffix.replace(/^\/+/, "");
  return `${getKeyPrefix()}${cleanSuffix}`;
}

export function getDefaultPlaybookKey(): string {
  return buildPlaybookKey("playbooks/_default.pdf");
}

export function getS3Client(): S3Client {
  if (client) return client;
  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION is not configured");
  }
  client = new S3Client({ region });
  return client;
}

export async function uploadPlaybook(
  key: string,
  body: Buffer | Uint8Array,
  contentType = "application/pdf",
): Promise<void> {
  const input: PutObjectCommandInput = {
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
  };
  await getS3Client().send(new PutObjectCommand(input));
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getS3Client().send(
      new HeadObjectCommand({ Bucket: getBucketName(), Key: key }),
    );
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return false;
    throw err;
  }
}

function encodeS3Key(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function copyObject(
  sourceKey: string,
  destKey: string,
): Promise<void> {
  const bucket = getBucketName();
  await getS3Client().send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `/${bucket}/${encodeS3Key(sourceKey)}`,
      Key: destKey,
    }),
  );
}

export const __testing = { encodeS3Key };

// Default presign TTL for playbook downloads. 1h is a sensible balance
// between "user can still open the link from their email/notes later" and
// "old links don't keep working indefinitely". Override per-environment via
// PLAYBOOK_PRESIGN_TTL_SECONDS (range clamped to [60, 6h] to avoid mis-config
// generating links that expire instantly or last all day).
const DEFAULT_PRESIGN_TTL_SECONDS = 3600;
const MIN_PRESIGN_TTL_SECONDS = 60;
const MAX_PRESIGN_TTL_SECONDS = 6 * 60 * 60;

export function getDefaultPresignTtlSeconds(): number {
  const raw = Number(process.env.PLAYBOOK_PRESIGN_TTL_SECONDS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_PRESIGN_TTL_SECONDS;
  return Math.min(
    MAX_PRESIGN_TTL_SECONDS,
    Math.max(MIN_PRESIGN_TTL_SECONDS, Math.floor(raw)),
  );
}

export async function getPresignedDownloadUrl(
  key: string,
  fileName: string,
  ttlSeconds: number = getDefaultPresignTtlSeconds(),
): Promise<string> {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "_");
  const cmd = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  });
  return getSignedUrl(getS3Client(), cmd, { expiresIn: ttlSeconds });
}
