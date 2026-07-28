export const CATEGORY_SLUGS = [
  "action",
  "adventure",
  "arcade",
  "cozy",
  "multiplayer",
  "platformer",
  "puzzle",
  "racing",
  "sports",
  "strategy",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const INPUT_MODES = ["keyboard", "mouse", "touch", "gamepad"] as const;
export type InputMode = (typeof INPUT_MODES)[number];

export const MULTIPLAYER_MODES = [
  "solo",
  "local-coop",
  "online-multiplayer",
  "single",
  "none",
] as const;
export type MultiplayerMode = (typeof MULTIPLAYER_MODES)[number];

export type GameOrientation = "landscape" | "portrait";
export type GameStatus = "published" | "preview" | "new";
export type LicenseType = "original" | "licensed" | "open-source";
export type GameSort = "featured" | "newest" | "title";

export interface DeveloperCredit {
  name: string;
  website: string | null;
}

export interface GameLicense {
  type: LicenseType;
  proofUrl: string;
  rightsExpiresAt: string | null;
}

export interface GameLevel {
  id: number;
  name: string;
  difficulty: number;
}

export interface Game {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  instructions: string;
  developer: DeveloperCredit;
  embedUrl: string | null;
  thumbnailUrl: string;
  coverUrl: string;
  aspectRatio: string;
  orientation: GameOrientation;
  inputModes: InputMode[];
  multiplayerMode: MultiplayerMode;
  ageRating: string;
  status: GameStatus;
  featuredRank: number | null;
  license: GameLicense;
  publishedAt: string;
  categories: CategorySlug[];
  tags: string[];
  accent: string;
  levels?: GameLevel[];
}

export interface GameFilters {
  query?: string;
  category?: CategorySlug;
  inputMode?: InputMode;
  multiplayerMode?: MultiplayerMode;
  sort?: GameSort;
  limit?: number;
}

export const REPORT_REASONS = [
  "broken-game",
  "inappropriate-content",
  "copyright",
  "privacy",
  "accessibility",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface PlaySessionInput {
  gameSlug: string;
  sessionId?: string;
  visitorId?: string;
  startedAt?: string;
  durationSeconds?: number;
}

export interface PlaySessionRecord {
  id: string;
  gameId: number;
  gameSlug: string;
  visitorId: string | null;
  startedAt: string;
  durationSeconds: number;
  createdAt: string;
}

export interface ReportInput {
  gameSlug: string;
  reason: ReportReason;
  details?: string;
  reporterId?: string;
}

export interface ReportRecord {
  id: string;
  gameId: number;
  gameSlug: string;
  reporterId: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}
