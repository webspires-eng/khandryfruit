"use client";

import { useActionState } from "react";
import Image from "next/image";
import { ExternalLink, ImagePlus, Trash2 } from "lucide-react";

import {
  deleteMediaAction,
  type MediaActionState,
  uploadMediaAction,
} from "@/server/actions/media";

const initialState: MediaActionState = { success: false, message: "" };

export type MediaLibraryItem = {
  key: string;
  url: string | null;
  sizeBytes: number;
  lastModified: string | null;
  altDe: string;
  altEn: string;
  registered: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function DeleteMediaForm({ storageKey }: { storageKey: string }) {
  const [state, action, pending] = useActionState(
    deleteMediaAction,
    initialState,
  );
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Remove this image permanently from R2?"))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="key" value={storageKey} />
      <button className="media-delete-button" disabled={pending} type="submit">
        <Trash2 size={15} /> {pending ? "Removing…" : "Remove"}
      </button>
      {state.message && (
        <p
          className={state.success ? "media-message success" : "media-message"}
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

export function MediaManager({ items }: { items: MediaLibraryItem[] }) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadMediaAction,
    initialState,
  );
  return (
    <>
      <section className="admin-card media-upload-card">
        <header>
          <div>
            <h2>Upload image</h2>
            <p>Images are scanned, validated and converted to WebP.</p>
          </div>
          <ImagePlus size={21} />
        </header>
        <form action={uploadAction} className="media-upload-form">
          <label className="media-file-field">
            <span>Image file</span>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
            />
            <small>JPEG, PNG, WebP or AVIF · maximum 8 MB</small>
          </label>
          <label>
            <span>German alternative text</span>
            <input name="altDe" minLength={2} maxLength={180} required />
          </label>
          <label>
            <span>English alternative text</span>
            <input name="altEn" minLength={2} maxLength={180} required />
          </label>
          <button className="button button-primary" disabled={uploadPending}>
            <ImagePlus size={16} />
            {uploadPending ? "Uploading…" : "Upload to R2"}
          </button>
          {uploadState.message && (
            <p
              className={
                uploadState.success ? "media-message success" : "media-message"
              }
              aria-live="polite"
            >
              {uploadState.message}
            </p>
          )}
        </form>
      </section>

      <section className="media-library" aria-label="Cloudflare R2 images">
        {items.map((item) => (
          <article className="media-card" key={item.key}>
            <div className="media-preview">
              {item.url ? (
                <Image
                  src={item.url}
                  alt={item.altEn || item.altDe || "Stored media image"}
                  fill
                  sizes="(max-width: 700px) 100vw, (max-width: 1200px) 33vw, 20vw"
                  unoptimized
                />
              ) : (
                <span>Public URL unavailable</span>
              )}
              <span className="media-source-badge">
                {item.registered ? "Managed" : "R2 object"}
              </span>
            </div>
            <div className="media-card-body">
              <strong title={item.key}>{item.key.split("/").at(-1)}</strong>
              <small>{item.key}</small>
              <dl>
                <div>
                  <dt>Size</dt>
                  <dd>{formatBytes(item.sizeBytes)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>
                    {item.lastModified
                      ? new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                        }).format(new Date(item.lastModified))
                      : "Unknown"}
                  </dd>
                </div>
              </dl>
              <div className="media-card-actions">
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} /> Open
                  </a>
                )}
                <DeleteMediaForm storageKey={item.key} />
              </div>
            </div>
          </article>
        ))}
      </section>
      {!items.length && (
        <section className="admin-card">
          <p className="admin-empty">No image objects are stored in R2 yet.</p>
        </section>
      )}
    </>
  );
}
