import { Cloud, Database, HardDrive } from "lucide-react";

import {
  MediaManager,
  type MediaLibraryItem,
} from "@/components/admin/media-manager";
import { db } from "@/lib/db/client";
import { listR2Images } from "@/lib/storage/media";
import { requireAdmin } from "@/server/policies/authorization";

export const revalidate = 0;

export default async function MediaPage() {
  await requireAdmin("media");
  const [objectsResult, assetsResult] = await Promise.allSettled([
    listR2Images(),
    db.mediaAsset.findMany(),
  ]);
  const objects =
    objectsResult.status === "fulfilled" ? objectsResult.value : [];
  const assets = assetsResult.status === "fulfilled" ? assetsResult.value : [];
  const byKey = new Map(assets.map((asset) => [asset.storageKey, asset]));
  const items: MediaLibraryItem[] = objects.map((object) => {
    const asset = byKey.get(object.key);
    return {
      key: object.key,
      url: object.url,
      sizeBytes: object.sizeBytes,
      lastModified: object.lastModified?.toISOString() ?? null,
      altDe: asset?.altDe ?? "",
      altEn: asset?.altEn ?? "",
      registered: Boolean(asset),
    };
  });
  const totalBytes = items.reduce((total, item) => total + item.sizeBytes, 0);
  const storageError = objectsResult.status === "rejected";

  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Super administrator</p>
          <h1>Media library</h1>
          <p>Manage validated image objects stored in Cloudflare R2.</p>
        </div>
      </div>

      {storageError && (
        <div className="media-storage-error" role="alert">
          R2 could not be reached. Confirm the bucket credentials and endpoint.
        </div>
      )}

      <section className="media-stat-grid">
        <article>
          <Cloud size={20} />
          <span>
            <small>R2 images</small>
            <strong>{items.length}</strong>
          </span>
        </article>
        <article>
          <Database size={20} />
          <span>
            <small>Managed assets</small>
            <strong>{assets.length}</strong>
          </span>
        </article>
        <article>
          <HardDrive size={20} />
          <span>
            <small>Displayed storage</small>
            <strong>{(totalBytes / 1_000_000).toFixed(1)} MB</strong>
          </span>
        </article>
      </section>

      <MediaManager items={items} />
    </div>
  );
}
