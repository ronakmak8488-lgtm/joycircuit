export const LIBRARY_KEY = "joycircuit:library:v1";
export const ANONYMOUS_ID_KEY = "joycircuit:anonymous:v1";
export const LEVEL_PROGRESS_KEY = "joycircuit:level-progress:v1";
export const LIBRARY_EVENT = "joycircuit:library-changed";

export type RecentGame = {
  slug: string;
  playedAt: string;
};

export type LibraryState = {
  version: 1;
  favorites: string[];
  recent: RecentGame[];
};

export type LevelProgress = Record<string, number>;

const EMPTY_LIBRARY: LibraryState = {
  version: 1,
  favorites: [],
  recent: [],
};

export function loadLibrary(): LibraryState {
  if (typeof window === "undefined") return EMPTY_LIBRARY;

  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    if (!raw) return EMPTY_LIBRARY;

    const value = JSON.parse(raw) as Partial<LibraryState>;
    if (value.version !== 1) return EMPTY_LIBRARY;

    return {
      version: 1,
      favorites: Array.isArray(value.favorites)
        ? value.favorites.filter((item): item is string => typeof item === "string")
        : [],
      recent: Array.isArray(value.recent)
        ? value.recent
            .filter(
              (item): item is RecentGame =>
                Boolean(item) &&
                typeof item.slug === "string" &&
                typeof item.playedAt === "string",
            )
            .slice(0, 24)
        : [],
    };
  } catch {
    return EMPTY_LIBRARY;
  }
}

export function saveLibrary(library: LibraryState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    window.dispatchEvent(new CustomEvent(LIBRARY_EVENT, { detail: library }));
  } catch {
    // Storage may be unavailable in private browsing or when quota is exhausted.
  }
}

export function toggleFavorite(slug: string): LibraryState {
  const library = loadLibrary();
  const favorites = library.favorites.includes(slug)
    ? library.favorites.filter((item) => item !== slug)
    : [slug, ...library.favorites].slice(0, 100);
  const next = { ...library, favorites };
  saveLibrary(next);
  return next;
}

export function addRecentGame(slug: string): LibraryState {
  const library = loadLibrary();
  const recent = [
    { slug, playedAt: new Date().toISOString() },
    ...library.recent.filter((item) => item.slug !== slug),
  ].slice(0, 24);
  const next = { ...library, recent };
  saveLibrary(next);
  return next;
}

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) return existing;

    const id = window.crypto?.randomUUID?.() ?? `anon-${Date.now().toString(36)}`;
    window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
    return id;
  } catch {
    return `anon-${Date.now().toString(36)}`;
  }
}

export function loadLevelProgress(): LevelProgress {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LEVEL_PROGRESS_KEY);
    if (!raw) return {};

    const value = JSON.parse(raw) as LevelProgress;
    if (typeof value !== "object" || Array.isArray(value)) return {};

    const progress: LevelProgress = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof key === "string" && typeof entry === "number" && Number.isInteger(entry) && entry >= 1) {
        progress[key] = Math.min(100, entry);
      }
    }
    return progress;
  } catch {
    return {};
  }
}

export function saveLevelProgress(progress: LevelProgress) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage may be unavailable.
  }
}

export function getCurrentLevel(slug: string): number {
  return loadLevelProgress()[slug] ?? 1;
}

export function advanceLevel(slug: string): number {
  const progress = loadLevelProgress();
  const next = Math.min(100, (progress[slug] ?? 1) + 1);
  progress[slug] = next;
  saveLevelProgress(progress);
  return next;
}

export function resetLevelProgress(slug: string) {
  const progress = loadLevelProgress();
  progress[slug] = 1;
  saveLevelProgress(progress);
}
