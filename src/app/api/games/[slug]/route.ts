import { NextResponse } from "next/server";

import { apiError, cleanSlug } from "@/app/api/_shared";
import { getGameBySlug, getRelatedGames } from "@/lib/games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GameRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: GameRouteContext) {
  const { slug: routeSlug } = await context.params;
  const slug = cleanSlug(routeSlug);
  if (!slug) return apiError(400, "INVALID_SLUG", "The game address is invalid.");

  try {
    const game = getGameBySlug(slug);
    if (!game) return apiError(404, "GAME_NOT_FOUND", "That game could not be found.");

    return NextResponse.json(
      { game, relatedGames: getRelatedGames(slug, 4) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return apiError(500, "GAME_UNAVAILABLE", "The game details are temporarily unavailable.");
  }
}
