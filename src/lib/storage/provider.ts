import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";
import { validateAndReencodeImage } from "@/lib/storage/image-validation";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_BYTES = 8_000_000;

export interface StorageProvider {
  createUpload(input: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256Base64: string;
  }): Promise<{ key: string; uploadUrl: string }>;
  finalizeUpload(input: {
    quarantineKey: string;
    purpose: "products" | "gift-boxes" | "certificates" | "content";
  }): Promise<{ key: string; contentType: string; checksumSha256: string }>;
}

export class S3StorageProvider implements StorageProvider {
  private readonly bucket =
    env.CLOUDFLARE_R2_BUCKET || env.AWS_S3_BUCKET || "";
  private readonly client = new S3Client({
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
  });

  async createUpload(input: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256Base64: string;
  }) {
    if (!this.bucket) throw new Error("STORAGE_NOT_CONFIGURED");
    if (
      !allowedTypes.has(input.mimeType) ||
      input.sizeBytes < 1 ||
      input.sizeBytes > MAX_BYTES ||
      !/^[A-Za-z0-9+/]{43}=$/.test(input.checksumSha256Base64)
    )
      throw new Error("INVALID_UPLOAD");
    const key = `quarantine/${new Date().getUTCFullYear()}/${randomUUID()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: "application/octet-stream",
      ContentLength: input.sizeBytes,
      ChecksumSHA256: input.checksumSha256Base64,
      Metadata: { uploadType: "image" },
    });
    return {
      key,
      uploadUrl: await getSignedUrl(this.client, command, { expiresIn: 300 }),
    };
  }

  async finalizeUpload(input: {
    quarantineKey: string;
    purpose: "products" | "gift-boxes" | "certificates" | "content";
  }) {
    if (!this.bucket) throw new Error("STORAGE_NOT_CONFIGURED");
    if (!/^quarantine\/\d{4}\/[0-9a-f-]{36}$/.test(input.quarantineKey))
      throw new Error("INVALID_QUARANTINE_KEY");
    try {
      const object = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: input.quarantineKey,
        }),
      );
      if (!object.Body || (object.ContentLength ?? MAX_BYTES + 1) > MAX_BYTES)
        throw new Error("INVALID_UPLOAD");
      const source = Buffer.from(await object.Body.transformToByteArray());
      await scanForMalware(source);
      const validated = await validateAndReencodeImage(source);
      const checksum = createHash("sha256").update(validated.bytes).digest();
      const key = `${input.purpose}/${new Date().getUTCFullYear()}/${randomUUID()}.webp`;
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: validated.bytes,
          ContentType: validated.contentType,
          ContentLength: validated.bytes.byteLength,
          ChecksumSHA256: checksum.toString("base64"),
          Metadata: {
            width: String(validated.width),
            height: String(validated.height),
            sourceFormat: validated.sourceFormat,
            scanStatus: "clean",
          },
        }),
      );
      return {
        key,
        contentType: validated.contentType,
        checksumSha256: checksum.toString("hex"),
      };
    } finally {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: input.quarantineKey,
        }),
      );
    }
  }
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
