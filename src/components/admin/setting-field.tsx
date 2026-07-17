"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, RotateCw, TriangleAlert } from "lucide-react";
import { updateSettingAction } from "@/server/actions/admin";

type Status = "idle" | "saving" | "saved" | "error";

/**
 * A single site setting that saves itself. Committing on blur (rather than on
 * every keystroke) keeps one request per edit and never persists a half-typed
 * value; unchanged fields never hit the server at all.
 */
export function SettingField({
  settingKey,
  label,
  defaultValue = "",
  hint,
  type = "text",
  wide,
  min,
  placeholder,
}: {
  settingKey: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  type?: string;
  wide?: boolean;
  min?: number;
  placeholder?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>();
  const savedValue = useRef(defaultValue);
  const lastAttempt = useRef(defaultValue);
  // Guards against an older in-flight save overwriting a newer one's result.
  const requestId = useRef(0);

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  const commit = async (value: string) => {
    lastAttempt.current = value;
    if (value === savedValue.current) {
      setStatus("idle");
      return;
    }
    const id = ++requestId.current;
    setStatus("saving");
    setMessage(undefined);
    const formData = new FormData();
    formData.set("key", settingKey);
    formData.set("value", value);
    const result = await updateSettingAction(formData);
    if (id !== requestId.current) return;
    if (result?.success) {
      savedValue.current = value;
      setStatus("saved");
      return;
    }
    setStatus("error");
    setMessage(result?.error?.message ?? "Could not save this setting.");
  };

  return (
    <label className={wide ? "admin-field wide" : "admin-field"}>
      <span>
        {label}
        <span
          className={`admin-field-status is-${status}`}
          role="status"
          aria-live="polite"
        >
          {status === "saving" && (
            <>
              <LoaderCircle size={12} className="admin-spin" /> Saving…
            </>
          )}
          {status === "saved" && (
            <>
              <Check size={12} /> Saved
            </>
          )}
          {status === "error" && (
            <>
              <TriangleAlert size={12} /> Not saved
            </>
          )}
        </span>
      </span>
      <input
        name={`setting:${settingKey}`}
        defaultValue={defaultValue}
        type={type}
        min={min}
        placeholder={placeholder}
        aria-invalid={status === "error"}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
      {hint && status !== "error" && (
        <small className="admin-field-hint">{hint}</small>
      )}
      {status === "error" && (
        <small className="admin-field-error">
          {message}
          <button type="button" onClick={() => commit(lastAttempt.current)}>
            <RotateCw size={11} /> Retry
          </button>
        </small>
      )}
    </label>
  );
}
