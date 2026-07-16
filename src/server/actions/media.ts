"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db/client";
import {
  deleteR2Image,
  mediaPublicUrl,
  storeMediaImage,
} from "@/lib/storage/media";
import { requireAdmin } from "@/server/policies/authorization";

export type MediaActionState = {
  success: boolean;
  message: string;
};

const keySchema = z
  .string()
  .min(1)
  .max(1024)
  .refine(
    (key) =>
      !key.startsWith("quarantine/") &&
      !key.startsWith("/") &&
      !key.includes("..") &&
      /^[A-Za-z0-9][A-Za-z0-9/_.\- ]+$/.test(key),
    "Invalid storage key.",
  );

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
    correlationId: h.get("x-vercel-id") ?? crypto.randomUUID(),
  };
}

function failure(error: unknown): MediaActionState {
  const code = error instanceof Error ? error.message : "MEDIA_ACTION_FAILED";
  const messages: Record<string, string> = {
    INVALID_IMAGE: "Choose a JPEG, PNG, WebP or AVIF image up to 8 MB.",
    R2_PUBLIC_URL_NOT_CONFIGURED:
      "Configure the public R2 media URL before uploading.",
    MALWARE_SCANNER_NOT_CONFIGURED:
      "The production malware scanner must be configured before uploads.",
    MALWARE_SCAN_FAILED: "The security scan could not be completed.",
    MALWARE_DETECTED: "The file did not pass the security scan.",
    MEDIA_IN_USE: "This image is currently used by store content.",
  };
  return { success: false, message: messages[code] ?? "The media action failed." };
}

export async function uploadMediaAction(
  _previous: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const session = await requireAdmin("media");
  let stored: Awaited<ReturnType<typeof storeMediaImage>> | null = null;
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("INVALID_IMAGE");
    const altDe = z.string().trim().min(2).max(180).parse(formData.get("altDe"));
    const altEn = z.string().trim().min(2).max(180).parse(formData.get("altEn"));
    stored = await storeMediaImage(file);
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.create({
        data: {
          storageKey: stored!.key,
          url: stored!.url,
          mimeType: stored!.mimeType,
          sizeBytes: stored!.sizeBytes,
          width: stored!.width,
          height: stored!.height,
          altDe,
          altEn,
          uploadedById: session.user.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "MEDIA_UPLOADED",
          entityType: "MediaAsset",
          entityId: asset.id,
          after: { storageKey: asset.storageKey, sizeBytes: asset.sizeBytes },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/media");
    return { success: true, message: "Image uploaded to Cloudflare R2." };
  } catch (error) {
    if (stored) await deleteR2Image(stored.key).catch(() => undefined);
    return failure(error);
  }
}

export async function deleteMediaAction(
  _previous: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const session = await requireAdmin("media", { recent: true });
  try {
    const key = keySchema.parse(formData.get("key"));
    const asset = await db.mediaAsset.findUnique({ where: { storageKey: key } });
    const publicUrl = mediaPublicUrl(key);
    const urls = [asset?.url, publicUrl].filter(
      (value): value is string => Boolean(value),
    );
    const [products, categories, giftBoxes, recipes, certificates] =
      urls.length > 0
        ? await Promise.all([
            db.productImage.count({ where: { url: { in: urls } } }),
            db.category.count({ where: { imageUrl: { in: urls } } }),
            db.giftBox.count({ where: { imageUrl: { in: urls } } }),
            db.recipe.count({ where: { imageUrl: { in: urls } } }),
            db.productCertificate.count({
              where: { documentUrl: { in: urls } },
            }),
          ])
        : [0, 0, 0, 0, 0];
    if (products + categories + giftBoxes + recipes + certificates > 0)
      throw new Error("MEDIA_IN_USE");

    const meta = await requestMeta();
    await deleteR2Image(key);
    await db.$transaction(async (tx) => {
      if (asset) await tx.mediaAsset.delete({ where: { id: asset.id } });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "MEDIA_DELETED",
          entityType: "MediaAsset",
          entityId: asset?.id,
          before: { storageKey: key, sizeBytes: asset?.sizeBytes },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/media");
    return { success: true, message: "Image removed from Cloudflare R2." };
  } catch (error) {
    return failure(error);
  }
}
