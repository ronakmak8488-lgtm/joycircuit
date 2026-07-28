import { NextResponse } from "next/server";

import { apiError } from "@/app/api/_shared";
import { getAllGames } from "@/lib/games";
import {
  CATEGORY_SLUGS,
  INPUT_MODES,
  MULTIPLAYER_MODES,
  type CategorySlug,
  type GameFilters,
  type GameSort,
  type InputMode,
  type MultiplayerMode,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORT_OPTIONS: GameSort[] = ["featured", "newest", "title"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? params.get("query") ?? "").trim();
  const category = params.get("category");
  const inputMode = params.get("input") ?? params.get("inputMode");
  const multiplayerMode = params.get("multiplayer") ?? params.get("multiplayerMode");
  const sort = params.get("sort") ?? "featured";
  const rawLimit = params.get("limit");
  const errors: Record<string, string> = {};

  if (query.length > 80) errors.q = "Search terms must be 80 characters or fewer.";
  if (category && !CATEGORY_SLUGS.includes(category as CategorySlug)) {
    errors.category = "Choose a supported category.";
  }
  if (inputMode && !INPUT_MODES.includes(inputMode as InputMode)) {
    errors.input = "Choose a supported input method.";
  }
  if (multiplayerMode && !MULTIPLAYER_MODES.includes(multiplayerMode as MultiplayerMode)) {
    errors.multiplayer = "Choose a supported multiplayer mode.";
  }
  if (!SORT_OPTIONS.includes(sort as GameSort)) {
    errors.sort = "Sort must be featured, newest, or title.";
  }

  let limit: number | undefined;
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      errors.limit = "Limit must be a whole number from 1 to 100.";
    }
  }

  if (Object.keys(errors).length) {
    return apiError(400, "INVALID_QUERY", "One or more query filters are invalid.", errors);
  }

  const filters: GameFilters = {
    ...(query ? { query } : {}),
    ...(category ? { category: category as CategorySlug } : {}),
    ...(inputMode ? { inputMode: inputMode as InputMode } : {}),
    ...(multiplayerMode
      ? { multiplayerMode: multiplayerMode as MultiplayerMode }
      : {}),
    sort: sort as GameSort,
    ...(limit ? { limit } : {}),
  };

  try {
    const games = getAllGames(filters);
    return NextResponse.json(
      { games, count: games.length, filters },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return apiError(500, "CATALOG_UNAVAILABLE", "The game catalog is temporarily unavailable.");
  }
}
