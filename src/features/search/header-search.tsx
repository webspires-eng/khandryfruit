"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { localizedPath } from "@/config/routes";
import { isLocale, type AppLocale } from "@/config/site";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  getServerRecentSearches,
  subscribeRecentSearches,
} from "@/features/search/recent-searches";

type Suggestion = { name: string; slug: string };

export function HeaderSearch() {
  const t = useTranslations("search");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale: AppLocale =
    params?.locale && isLocale(params.locale) ? params.locale : "de";

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  // Suggestions are keyed by the term they belong to, so stale entries are
  // never rendered and the fetch effect never has to clear state itself.
  const [suggestionState, setSuggestionState] = useState<{
    term: string;
    items: Suggestion[];
  }>({ term: "", items: [] });
  const recent = useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearches,
    getServerRecentSearches,
  );
  const term = value.trim();
  const suggestions =
    suggestionState.term === term ? suggestionState.items : [];

  const openOverlay = useCallback(() => {
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Global shortcuts: "/" outside form fields, or Cmd/Ctrl+K anywhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openOverlay();
        return;
      }
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      )
        return;
      event.preventDefault();
      openOverlay();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openOverlay]);

  // Escape closes the overlay and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Debounced product suggestions; stale requests are aborted.
  useEffect(() => {
    const nextTerm = value.trim();
    if (nextTerm.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(
        `/api/search/suggestions?q=${encodeURIComponent(nextTerm)}&locale=${locale}`,
        { signal: controller.signal },
      )
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { suggestions?: unknown } | null) => {
          const list = data?.suggestions;
          if (!Array.isArray(list)) return;
          setSuggestionState({
            term: nextTerm,
            items: list
              .filter(
                (entry): entry is Suggestion =>
                  typeof entry === "object" &&
                  entry !== null &&
                  typeof (entry as Suggestion).name === "string" &&
                  typeof (entry as Suggestion).slug === "string",
              )
              .slice(0, 5),
          });
        })
        .catch(() => {
          // Network errors and aborts are ignored — suggestions stay empty.
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, locale]);

  function submit(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    router.push(
      `/${locale}${localizedPath("search", locale)}?q=${encodeURIComponent(trimmed)}`,
    );
    close();
  }

  return (
    <div className="header-search">
      <button
        ref={triggerRef}
        type="button"
        className="icon-link"
        aria-label={t("openSearch")}
        aria-expanded={open}
        onClick={openOverlay}
      >
        <Search size={20} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("inputLabel")}
          onClick={close}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                submit(value);
              }}
            >
              <label className="sr-only" htmlFor="header-search">
                {t("inputLabel")}
              </label>
              <div className="search-bar">
                <Search size={18} aria-hidden="true" />
                <input
                  id="header-search"
                  name="q"
                  type="search"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={t("placeholder")}
                  autoComplete="off"
                  autoFocus
                />
                {value !== "" && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t("clear")}
                    onClick={() => setValue("")}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
                <button className="button" type="submit">
                  {t("submit")}
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("closeSearch")}
                  onClick={close}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </form>
            {term.length >= 2 && suggestions.length > 0 && (
              <div className="search-suggestions">
                <ul className="chip-list">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.slug}>
                      <a href={`/${locale}/product/${suggestion.slug}`}>
                        {suggestion.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {term === "" && (
              <div className="search-suggestions">
                {recent.length > 0 && (
                  <>
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
                        <button
                          type="button"
                          onClick={() => clearRecentSearches()}
                        >
                          {t("recentClear")}
                        </button>
                      </li>
                    </ul>
                  </>
                )}
                <p className="muted">{t("lead")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
