"use client";

import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { LIBRARY_EVENT, LIBRARY_KEY, loadLibrary } from "@/lib/library-storage";
import type { Game } from "@/lib/types";

export function ContinuePlaying({ games }: { games: Game[] }) {
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setRecentSlugs(loadLibrary().recent.map((item) => item.slug));
    const onStorage = (event: StorageEvent) => {
      if (event.key === LIBRARY_KEY) sync();
    };
    sync();
    window.addEventListener(LIBRARY_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LIBRARY_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const recentGames = useMemo(() => {
    const bySlug = new Map(games.map((game) => [game.slug, game]));
    return recentSlugs.flatMap((slug) => {
      const game = bySlug.get(slug);
      return game ? [game] : [];
    }).slice(0, 4);
  }, [games, recentSlugs]);

  if (recentGames.length === 0) return null;

  return (
    <section className="continue-section" aria-labelledby="continue-title">
      <h2 id="continue-title">Continue playing</h2>
      <div className="continue-grid">{recentGames.map((game) => <GameCard game={game} compact key={game.slug} />)}</div>
    </section>
  );
}
