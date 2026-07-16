"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import { localizedPath } from "@/config/routes";
import type { AppLocale } from "@/config/site";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  getServerRecentSearches,
  subscribeRecentSearches,
} from "@/features/search/recent-searches";

export function SearchForm({
  locale,
  initialQuery,
}: {
  locale: AppLocale;
  initialQuery: string;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialQuery);
  const recent = useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearches,
    getServerRecentSearches,
  );
  const [isPending, startTransition] = useTransition();

  function submit(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    startTransition(() => {
      router.push(
        `/${locale}${localizedPath("search", locale)}?q=${encodeURIComponent(trimmed)}`,
      );
    });
  }

  return (
    <form
      role="search"
      className="search-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
    >
      <label className="sr-only" htmlFor="site-search">
        {t("inputLabel")}
      </label>
      <div className="search-bar">
        <Search size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          id="site-search"
          name="q"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setValue("");
          }}
          placeholder={t("placeholder")}
          autoComplete="off"
          autoFocus={initialQuery === ""}
        />
        {value !== "" && (
          <button
            type="button"
            className="icon-button"
            aria-label={t("clear")}
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button className="button" type="submit">
          {t("submit")}
        </button>
      </div>
      {isPending && (
        <p className="muted" role="status">
          {t("loading")}
        </p>
      )}
      {value.trim() === "" && recent.length > 0 && (
        <div className="search-sections">
          <section>
            <h2>{t("recentTitle")}</h2>
            <ul className="chip-list">
              {recent.map((term) => (
                <li key={term}>
                  <button type="button" onClick={() => submit(term)}>
                    {term}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => clearRecentSearches()}>
                  {t("recentClear")}
                </button>
              </li>
            </ul>
          </section>
        </div>
      )}
    </form>
  );
}
