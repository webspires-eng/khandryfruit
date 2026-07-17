"use client";

import { useEffect, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { FlagDe, FlagGb } from "./brand-icons";

const languages = [
  { locale: "de", label: "Deutsch" },
  { locale: "en", label: "English" },
] as const;

function Flag({
  locale,
  uid,
  size,
}: {
  locale: string;
  uid: string;
  size?: number;
}) {
  return locale === "de" ? (
    <FlagDe size={size} />
  ) : (
    <FlagGb uid={uid} size={size} />
  );
}

export function LanguageSwitcher() {
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const current =
    languages.find((entry) => entry.locale === params.locale) ?? languages[0];
  const ref = useRef<HTMLDetailsElement>(null);

  // <details> has no built-in dismiss, so close it on outside click and Escape.
  useEffect(() => {
    const close = (event: Event) => {
      const node = ref.current;
      if (!node?.open) return;
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event.type === "click" && node.contains(event.target as Node)) return;
      node.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details className="language-menu" ref={ref}>
      {/* Flag only — the language name lives in the dropdown and aria-label. */}
      <summary aria-label={`Language: ${current.label}`}>
        <Flag locale={current.locale} uid="current" size={22} />
        <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div role="menu">
        {languages.map((entry) => {
          const target = pathname.replace(
            /^\/(de|en)(?=\/|$)/,
            `/${entry.locale}`,
          );
          const active = entry.locale === current.locale;
          return (
            <a
              key={entry.locale}
              href={target}
              hrefLang={entry.locale}
              role="menuitem"
              className={active ? "active" : ""}
              aria-current={active ? "true" : undefined}
            >
              <Flag locale={entry.locale} uid={`opt-${entry.locale}`} />
              <span>{entry.label}</span>
              {active && <Check size={14} aria-hidden="true" />}
            </a>
          );
        })}
      </div>
    </details>
  );
}
