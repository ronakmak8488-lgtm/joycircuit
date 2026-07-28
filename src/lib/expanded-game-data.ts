import arcadeManifestJson from "../../public/games/joy-arcade/manifest.json";
import threeDManifestJson from "../../public/games/joy-3d/manifest.json";

import {
  CATEGORY_SLUGS,
  INPUT_MODES,
  type CategorySlug,
  type Game,
  type InputMode,
  type LicenseType,
  type MultiplayerMode,
} from "@/lib/types";

interface ExpansionConfig {
  source: string;
  expectedCount: number;
  rankStart: number;
  newCount: number;
  embedBase: string;
  licenseType: LicenseType;
  licenseProofUrl: string;
  requiredTag?: string;
  requireAssetLicense?: boolean;
  requireAssetPack?: boolean;
  gameplayModes?: readonly string[];
  fixedMultiplayerMode?: MultiplayerMode;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readText(
  entry: Record<string, unknown>,
  field: string,
  source: string,
): string {
  const value = entry[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${source}: ${field} must be a non-empty string.`);
  }
  return value.trim();
}

function readStringList(
  entry: Record<string, unknown>,
  field: string,
  source: string,
): string[] {
  const value = entry[field];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((item) => typeof item === "string" && item.trim())
  ) {
    throw new Error(`${source}: ${field} must be a non-empty string array.`);
  }
  return [...new Set(value.map((item) => (item as string).trim().toLocaleLowerCase()))];
}

function readCategories(entry: Record<string, unknown>, source: string): CategorySlug[] {
  const categories = readStringList(entry, "categories", source);
  for (const category of categories) {
    if (!CATEGORY_SLUGS.includes(category as CategorySlug)) {
      throw new Error(`${source}: unsupported category “${category}”.`);
    }
  }
  return categories as CategorySlug[];
}

function readInputModes(entry: Record<string, unknown>, source: string): InputMode[] {
  const inputModes = readStringList(entry, "inputModes", source);
  for (const inputMode of inputModes) {
    if (!INPUT_MODES.includes(inputMode as InputMode)) {
      throw new Error(`${source}: unsupported input mode “${inputMode}”.`);
    }
  }
  return inputModes as InputMode[];
}

function readMultiplayerMode(
  entry: Record<string, unknown>,
  source: string,
  config: ExpansionConfig,
): MultiplayerMode {
  const mode = readText(entry, "mode", source).toLocaleLowerCase();
  if (config.gameplayModes) {
    if (!config.gameplayModes.includes(mode)) {
      throw new Error(`${source}: unsupported gameplay mode “${mode}”.`);
    }
    return config.fixedMultiplayerMode ?? "solo";
  }
  const modes: Record<string, MultiplayerMode> = {
    solo: "solo",
    single: "solo",
    "single-player": "solo",
    local: "local-coop",
    "local-coop": "local-coop",
    "two-player": "local-coop",
    multiplayer: "online-multiplayer",
    online: "online-multiplayer",
    "online-multiplayer": "online-multiplayer",
  };
  const normalized = modes[mode];
  if (!normalized) throw new Error(`${source}: unsupported game mode “${mode}”.`);
  return normalized;
}

function publishedAtForRank(rank: number): string {
  const releaseEpoch = Date.UTC(2026, 6, 21, 6, 0, 0);
  return new Date(releaseEpoch - (rank - 13) * 6 * 60 * 60 * 1_000).toISOString();
}

function mapManifest(
  manifest: unknown,
  config: ExpansionConfig,
): Omit<Game, "id">[] {
  if (!isRecord(manifest) || !Array.isArray(manifest.games)) {
    throw new Error(`${config.source}: manifest root must contain a games array.`);
  }
  if (manifest.games.length !== config.expectedCount) {
    throw new Error(
      `${config.source}: expected ${config.expectedCount} games, received ${manifest.games.length}.`,
    );
  }

  const seenSlugs = new Set<string>();
  return manifest.games.map((value, index) => {
    const source = `${config.source} game ${index + 1}`;
    if (!isRecord(value)) throw new Error(`${source}: entry must be an object.`);

    const slug = readText(value, "slug", source).toLocaleLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
      throw new Error(`${source}: invalid slug “${slug}”.`);
    }
    if (seenSlugs.has(slug)) throw new Error(`${config.source}: duplicate slug “${slug}”.`);
    seenSlugs.add(slug);

    const accent = readText(value, "accent", source).toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(accent)) {
      throw new Error(`${source}: accent must be a six-digit hex color.`);
    }

    const tags = readStringList(value, "tags", source);
    if (config.gameplayModes) {
      const gameplayMode = readText(value, "mode", source).toLocaleLowerCase();
      if (!tags.includes(gameplayMode)) tags.push(gameplayMode);
    }
    if (config.requiredTag && !tags.includes(config.requiredTag)) {
      throw new Error(`${source}: tags must include “${config.requiredTag}”.`);
    }

    if (config.requireAssetLicense) {
      const assetLicenseUrl = readText(value, "assetLicenseUrl", source);
      let validExternalLicense = false;
      try {
        const parsedLicenseUrl = new URL(assetLicenseUrl);
        validExternalLicense = parsedLicenseUrl.protocol === "https:" || parsedLicenseUrl.protocol === "http:";
      } catch {
        validExternalLicense = false;
      }
      if (assetLicenseUrl !== config.licenseProofUrl && !validExternalLicense) {
        throw new Error(
          `${source}: assetLicenseUrl must be a safe web URL or ${config.licenseProofUrl}.`,
        );
      }
    }
    if (config.requireAssetPack) readText(value, "assetPack", source);

    const rank = config.rankStart + index;
    return {
      slug,
      title: readText(value, "title", source),
      tagline: readText(value, "tagline", source),
      description: readText(value, "description", source),
      instructions: readText(value, "instructions", source),
      developer: { name: "JoyCircuit Studio", website: null },
      embedUrl: `${config.embedBase}${encodeURIComponent(slug)}`,
      thumbnailUrl: `/api/game-art/${encodeURIComponent(slug)}?variant=thumbnail`,
      coverUrl: `/api/game-art/${encodeURIComponent(slug)}?variant=cover`,
      aspectRatio: "16 / 9",
      orientation: "landscape",
      inputModes: readInputModes(value, source),
      multiplayerMode: readMultiplayerMode(value, source, config),
      ageRating: "Everyone",
      status: index < config.newCount ? "new" : "published",
      featuredRank: rank,
      license: {
        type: config.licenseType,
        proofUrl: config.licenseProofUrl,
        rightsExpiresAt: null,
      },
      publishedAt: publishedAtForRank(rank),
      categories: readCategories(value, source),
      tags,
      accent,
    } satisfies Omit<Game, "id">;
  });
}

const arcadeGames = mapManifest(arcadeManifestJson, {
  source: "joy-arcade",
  expectedCount: 51,
  rankStart: 13,
  newCount: 15,
  embedBase: "/games/joy-arcade/index.html?game=",
  licenseType: "original",
  licenseProofUrl: "/about#content-rights",
  gameplayModes: [
    "dodger",
    "lane-racer",
    "snake",
    "breakout",
    "shooter",
    "catcher",
    "memory",
    "pong",
    "maze",
    "runner",
    "defense",
    "orbit",
    "stacker",
  ],
  fixedMultiplayerMode: "solo",
});

const threeDGames = mapManifest(threeDManifestJson, {
  source: "joy-3d",
  expectedCount: 10,
  rankStart: 64,
  newCount: 10,
  embedBase: "/games/joy-3d/index.html?game=",
  licenseType: "open-source",
  licenseProofUrl: "/assets/3d/ATTRIBUTION.md",
  requiredTag: "3d",
  requireAssetLicense: true,
  requireAssetPack: true,
  gameplayModes: [
    "racing",
    "exploration",
    "platformer",
    "flight",
    "range",
    "maze",
    "sports",
    "defense",
    "stacker",
    "delivery",
  ],
  fixedMultiplayerMode: "solo",
});

export const expandedSeedGames: Omit<Game, "id">[] = [...arcadeGames, ...threeDGames];
