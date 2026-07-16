import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/lib/env";
import { validateAndReencodeImage } from "@/lib/storage/image-validation";

const MAX_BYTES = 8_000_000;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const imageKeyPattern = /\.(?:avif|jpe?g|png|webp)$/i;

function storageConfig() {
  const bucket = env.CLOUDFLARE_R2_BUCKET || env.AWS_S3_BUCKET || "";
  if (!bucket) throw new Error("STORAGE_NOT_CONFIGURED");
  return {
    bucket,
    client: new S3Client({
      region: env.CLOUDFLARE_R2_ACCOUNT_ID ? "auto" : env.AWS_REGION,
      endpoint: env.CLOUDFLARE_R2_ACCOUNT_ID
        ? `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(env.AWS_S3_ENDPOINT),
      credentials:
        env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
        env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
              secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            }
          : undefined,
    }),
  };
}

export function mediaPublicUrl(key: string) {
  const base = env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
  if (!base) return null;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return new URL(encodedKey, `${base.replace(/\/$/, "")}/`).href;
}

export async function listR2Images(limit = 200) {
  const { bucket, client } = storageConfig();
  const result = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, MaxKeys: Math.min(limit, 500) }),
  );
  return (result.Contents ?? [])
    .filter(
      (item) =>
        item.Key &&
        !item.Key.startsWith("quarantine/") &&
        imageKeyPattern.test(item.Key),
    )
    .map((item) => ({
      key: item.Key!,
      url: mediaPublicUrl(item.Key!),
      sizeBytes: item.Size ?? 0,
      lastModified: item.LastModified ?? null,
    }))
    .sort(
      (a, b) =>
        (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0),
    );
}

export async function storeMediaImage(file: File) {
  if (
    !allowedTypes.has(file.type) ||
    file.size < 1 ||
    file.size > MAX_BYTES
  )
    throw new Error("INVALID_IMAGE");

  const source = Buffer.from(await file.arrayBuffer());
  await scanForMalware(source);
  const validated = await validateAndReencodeImage(source);
  const checksum = createHash("sha256").update(validated.bytes).digest();
  const key = `content/${new Date().getUTCFullYear()}/${randomUUID()}.webp`;
  const { bucket, client } = storageConfig();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: validated.bytes,
      ContentType: validated.contentType,
      ContentLength: validated.bytes.byteLength,
      ChecksumSHA256: checksum.toString("base64"),
      Metadata: {
        width: String(validated.width),
        height: String(validated.height),
        sourceFormat: validated.sourceFormat,
        originalName: file.name.slice(0, 120),
        scanStatus: "clean",
      },
    }),
  );
  const url = mediaPublicUrl(key);
  if (!url) {
    await deleteR2Image(key);
    throw new Error("R2_PUBLIC_URL_NOT_CONFIGURED");
  }
  return {
    key,
    url,
    mimeType: validated.contentType,
    sizeBytes: validated.bytes.byteLength,
    width: validated.width,
    height: validated.height,
  };
}

export async function deleteR2Image(key: string) {
  const { bucket, client } = storageConfig();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

async function scanForMalware(bytes: Buffer) {
  if (!env.MALWARE_SCAN_URL || !env.MALWARE_SCAN_TOKEN) {
    if (env.NODE_ENV === "production")
      throw new Error("MALWARE_SCANNER_NOT_CONFIGURED");
    return;
  }
  const response = await fetch(env.MALWARE_SCAN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MALWARE_SCAN_TOKEN}`,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("MALWARE_SCAN_FAILED");
  const result = (await response.json()) as { clean?: boolean };
  if (result.clean !== true) throw new Error("MALWARE_DETECTED");
}
