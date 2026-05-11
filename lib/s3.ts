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

export function getS3Client(): S3Client {
  if (client) return client;
  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION is not configured");
  }
  client = new S3Client({ region });
  return client;
}

export const DEFAULT_PLAYBOOK_KEY =
  "Provider_Playbook_Business_Services_Professionals-2026.pdf";

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

export async function copyObject(
  sourceKey: string,
  destKey: string,
): Promise<void> {
  const bucket = getBucketName();
  await getS3Client().send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `/${bucket}/${encodeURIComponent(sourceKey)}`,
      Key: destKey,
    }),
  );
}

export async function getPresignedDownloadUrl(
  key: string,
  fileName: string,
  ttlSeconds = 300,
): Promise<string> {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "_");
  const cmd = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  });
  return getSignedUrl(getS3Client(), cmd, { expiresIn: ttlSeconds });
}
