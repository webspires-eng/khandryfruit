const KEY = "kdf-recent-searches";
const MAX_ENTRIES = 6;
const EMPTY: string[] = [];

// Cache the parsed list per raw string so repeated reads return a stable
// reference — required by useSyncExternalStore snapshots.
let cachedRaw: string | null = null;
let cachedList: string[] = EMPTY;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Subscribe to recent-search changes (for useSyncExternalStore). */
export function subscribeRecentSearches(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable server snapshot (for useSyncExternalStore). */
export function getServerRecentSearches(): string[] {
  return EMPTY;
}

/** Recent search terms, most recent first. Returns [] on SSR or bad data. */
export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  if (!raw) {
    cachedList = EMPTY;
    return cachedList;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cachedList = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : EMPTY;
  } catch {
    cachedList = EMPTY;
  }
  return cachedList;
}

/** Prepend a term (case-insensitive dedupe, capped) and persist the list. */
export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  if (typeof window === "undefined" || !trimmed) return getRecentSearches();
  const next = [
    trimmed,
    ...getRecentSearches().filter(
      (entry) => entry.toLowerCase() !== trimmed.toLowerCase(),
    ),
  ].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode, quota) — fail silently.
  }
  emit();
  return getRecentSearches();
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore storage failures.
  }
  emit();
}
