import { randomUUID } from "node:crypto";

import { getDatabase } from "@/lib/db";
import { generateLevels } from "@/lib/levels";
import { CATEGORY_SLUGS, REPORT_REASONS } from "@/lib/types";
import type {
  CategorySlug,
  Game,
  GameFilters,
  PlaySessionInput,
  PlaySessionRecord,
  ReportInput,
  ReportRecord,
} from "@/lib/types";

interface GameRow {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  instructions: string;
  developer_name: string;
  developer_website: string | null;
  embed_url: string | null;
  thumbnail_url: string;
  cover_url: string;
  aspect_ratio: string;
  orientation: Game["orientation"];
  input_modes_json: string;
  multiplayer_mode: Game["multiplayerMode"];
  age_rating: string;
  status: Game["status"];
  featured_rank: number | null;
  license_type: Game["license"]["type"];
  license_proof_url: string;
  rights_expires_at: string | null;
  published_at: string;
  categories_json: string;
  tags_json: string;
  accent: string;
}

function parseStringArray<T extends string>(value: string): T[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? (parsed as T[])
      : [];
  } catch {
    return [];
  }
}

function rowToGame(row: GameRow): Game {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    instructions: row.instructions,
    developer: {
      name: row.developer_name,
      website: row.developer_website,
    },
    embedUrl: row.embed_url,
    thumbnailUrl: row.thumbnail_url,
    coverUrl: row.cover_url,
    aspectRatio: row.aspect_ratio,
    orientation: row.orientation,
    inputModes: parseStringArray<Game["inputModes"][number]>(row.input_modes_json),
    multiplayerMode: row.multiplayer_mode,
    ageRating: row.age_rating,
    status: row.status,
    featuredRank: row.featured_rank,
    license: {
      type: row.license_type,
      proofUrl: row.license_proof_url,
      rightsExpiresAt: row.rights_expires_at,
    },
    publishedAt: row.published_at,
    categories: parseStringArray<CategorySlug>(row.categories_json),
    tags: parseStringArray<string>(row.tags_json),
    accent: row.accent,
    levels: generateLevels(row.slug),
  };
}

function readAllGames(): Game[] {
  const rows = getDatabase()
    .prepare("SELECT * FROM games WHERE catalog_active = 1")
    .all() as unknown as GameRow[];
  return rows.map(rowToGame);
}

export function filterGames(games: Game[], filters: GameFilters = {}): Game[] {
  const normalizedQuery = filters.query?.trim().toLocaleLowerCase() ?? "";

  let result = games.filter((game) => {
    if (filters.category && !game.categories.includes(filters.category)) return false;
    if (filters.inputMode && !game.inputModes.includes(filters.inputMode)) return false;
    if (filters.multiplayerMode && game.multiplayerMode !== filters.multiplayerMode) return false;

    if (normalizedQuery) {
      const searchable = [
        game.title,
        game.tagline,
        game.description,
        game.developer.name,
        ...game.categories,
        ...game.tags,
      ]
        .join(" ")
        .toLocaleLowerCase();
      if (!searchable.includes(normalizedQuery)) return false;
    }

    return true;
  });

  switch (filters.sort ?? "featured") {
    case "newest":
      result = result.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      break;
    case "title":
      result = result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "featured":
      result = result.sort((a, b) => {
        const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB || b.publishedAt.localeCompare(a.publishedAt);
      });
      break;
  }

  return typeof filters.limit === "number" ? result.slice(0, filters.limit) : result;
}

export function getAllGames(filters: GameFilters = {}): Game[] {
  return filterGames(readAllGames(), filters);
}

export function getFeaturedGame(): Game | null {
  return getAllGames({ sort: "featured", limit: 1 })[0] ?? null;
}

export function getGameBySlug(slug: string): Game | null {
  const normalizedSlug = slug.trim().toLocaleLowerCase();
  const row = getDatabase()
    .prepare("SELECT * FROM games WHERE slug = ? AND catalog_active = 1 LIMIT 1")
    .get(normalizedSlug) as unknown as GameRow | undefined;
  return row ? rowToGame(row) : null;
}

export function getGamesByCategory(
  category: string,
  filters: Omit<GameFilters, "category"> = {},
): Game[] {
  const normalizedCategory = category.trim().toLocaleLowerCase();
  if (!CATEGORY_SLUGS.includes(normalizedCategory as CategorySlug)) return [];
  return getAllGames({ ...filters, category: normalizedCategory as CategorySlug });
}

export function searchGames(
  query: string,
  filters: Omit<GameFilters, "query"> = {},
): Game[] {
  return getAllGames({ ...filters, query });
}

export function getRelatedGames(slug: string, limit = 4): Game[] {
  const game = getGameBySlug(slug);
  if (!game) return [];

  return readAllGames()
    .filter((candidate) => candidate.slug !== game.slug)
    .map((candidate) => ({
      candidate,
      score:
        candidate.categories.filter((category) => game.categories.includes(category)).length * 3 +
        candidate.tags.filter((tag) => game.tags.includes(tag)).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.candidate.featuredRank ?? 999) - (b.candidate.featuredRank ?? 999),
    )
    .slice(0, Math.max(0, limit))
    .map(({ candidate }) => candidate);
}

export function createPlaySession(input: PlaySessionInput): PlaySessionRecord | null {
  const game = getGameBySlug(input.gameSlug);
  if (!game) return null;

  const durationSeconds = input.durationSeconds ?? 0;
  if (!Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 86_400) {
    throw new RangeError("Play-session duration is outside the supported range.");
  }

  const startedAt = input.startedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(startedAt))) {
    throw new RangeError("Play-session start time is invalid.");
  }

  const record: PlaySessionRecord = {
    id: input.sessionId ?? randomUUID(),
    gameId: game.id,
    gameSlug: game.slug,
    visitorId: input.visitorId ?? null,
    startedAt,
    durationSeconds,
    createdAt: new Date().toISOString(),
  };

  getDatabase()
    .prepare(`
      INSERT OR IGNORE INTO play_sessions (
        id, game_id, visitor_id, started_at, duration_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      record.id,
      record.gameId,
      record.visitorId,
      record.startedAt,
      record.durationSeconds,
      record.createdAt,
    );

  return record;
}

export function updatePlaySessionDuration(
  sessionId: string,
  gameSlug: string,
  durationSeconds: number,
): boolean {
  if (!Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 86_400) {
    throw new RangeError("Play-session duration is outside the supported range.");
  }

  const result = getDatabase()
    .prepare(`
      UPDATE play_sessions
      SET duration_seconds = MAX(duration_seconds, ?)
      WHERE id = ?
        AND game_id = (
          SELECT id FROM games WHERE slug = ? AND catalog_active = 1 LIMIT 1
        )
    `)
    .run(durationSeconds, sessionId, gameSlug.trim().toLocaleLowerCase());
  return Number(result.changes) > 0;
}

export function createReport(input: ReportInput): ReportRecord | null {
  const game = getGameBySlug(input.gameSlug);
  if (!game) return null;
  if (!REPORT_REASONS.includes(input.reason)) throw new RangeError("Unsupported report reason.");
  if (input.details && input.details.length > 1_000) throw new RangeError("Report details are too long.");

  const record: ReportRecord = {
    id: randomUUID(),
    gameId: game.id,
    gameSlug: game.slug,
    reporterId: input.reporterId ?? null,
    reason: input.reason,
    details: input.details ?? null,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  getDatabase()
    .prepare(`
      INSERT INTO reports (
        id, game_id, reporter_id, reason, details, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      record.id,
      record.gameId,
      record.reporterId,
      record.reason,
      record.details,
      record.status,
      record.createdAt,
    );

  return record;
}
