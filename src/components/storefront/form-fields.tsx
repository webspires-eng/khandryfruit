import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldChrome = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  wide?: boolean;
};

function describedBy(name: string, error?: string, hint?: string) {
  const ids = [error ? `${name}-error` : null, hint ? `${name}-hint` : null].filter(
    Boolean,
  );
  return ids.length ? ids.join(" ") : undefined;
}

function FieldMessages({ name, error, hint }: Omit<FieldChrome, "label" | "wide">) {
  return (
    <>
      {hint && (
        <small className="field-hint" id={`${name}-hint`}>
          {hint}
        </small>
      )}
      {error && (
        <small className="field-error" id={`${name}-error`} role="alert">
          {error}
        </small>
      )}
    </>
  );
}

export function TextField({
  label,
  name,
  error,
  hint,
  wide,
  ...props
}: FieldChrome & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>
        {label}
        {props.required ? " *" : ""}
      </span>
      <input
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        {...props}
      />
      <FieldMessages name={name} error={error} hint={hint} />
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  wide,
  ...props
}: FieldChrome & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>
        {label}
        {props.required ? " *" : ""}
      </span>
      <textarea
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        {...props}
      />
      <FieldMessages name={name} error={error} hint={hint} />
    </label>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  wide,
  options,
  placeholder,
  ...props
}: FieldChrome & {
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>
        {label}
        {props.required ? " *" : ""}
      </span>
      <select
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        {...props}
        defaultValue={
          props.value !== undefined ? undefined : (props.defaultValue ?? "")
        }
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages name={name} error={error} hint={hint} />
    </label>
  );
}

export function CheckboxOption({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="checkbox-option">
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function ConsentRow({
  label,
  name,
  error,
  ...props
}: { label: string; name: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="consent-row">
      <input
        type="checkbox"
        id={`${name}-consent`}
        name={name}
        value="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      <label htmlFor={`${name}-consent`}>
        {label}
        {error && (
          <small className="field-error" id={`${name}-error`} role="alert">
            {error}
          </small>
        )}
      </label>
    </div>
  );
}

/**
 * Spam honeypot: visually hidden, ignored by humans, tempting for bots. Kept
 * out of the accessibility tree and tab order.
 */
export function HoneypotField({ name, label }: { name: string; label: string }) {
  return (
    <div className="honeypot-field" aria-hidden="true">
      <label>
        {label}
        <input type="text" name={name} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function FormErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert">
      {message}
    </div>
  );
}
