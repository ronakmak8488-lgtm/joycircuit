"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { HeartIcon, HistoryIcon } from "@/components/icons";
import { LIBRARY_EVENT, LIBRARY_KEY, loadLibrary, type LibraryState } from "@/lib/library-storage";
import type { Game } from "@/lib/types";

type LibraryViewProps = { games: Game[]; initialView: "recent" | "favorites" };

const EMPTY: LibraryState = { version: 1, favorites: [], recent: [] };

export function LibraryView({ games, initialView }: LibraryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view = requestedView === "favorites" ? "favorites" : requestedView === "recent" ? "recent" : initialView;
  const [library, setLibrary] = useState<LibraryState>(EMPTY);

  useEffect(() => {
    const sync = () => setLibrary(loadLibrary());
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

  const visibleGames = useMemo(() => {
    const bySlug = new Map(games.map((game) => [game.slug, game]));
    const slugs = view === "favorites" ? library.favorites : library.recent.map((item) => item.slug);
    return slugs.flatMap((slug) => {
      const game = bySlug.get(slug);
      return game ? [game] : [];
    });
  }, [games, library, view]);

  function changeView(next: "recent" | "favorites") {
    router.replace(`/library?view=${next}`, { scroll: false });
  }

  return (
    <section className="library-panel" aria-labelledby="library-title">
      <div className="library-tabs" role="tablist" aria-label="Library sections">
        <button type="button" role="tab" aria-selected={view === "recent"} className={view === "recent" ? "is-active" : ""} onClick={() => changeView("recent")}><HistoryIcon size={18} />Recent</button>
        <button type="button" role="tab" aria-selected={view === "favorites"} className={view === "favorites" ? "is-active" : ""} onClick={() => changeView("favorites")}><HeartIcon size={18} />Favorites</button>
      </div>
      <h2 id="library-title" className="sr-only">{view === "recent" ? "Recently played games" : "Favorite games"}</h2>
      {visibleGames.length > 0 ? (
        <div className="catalog-grid">{visibleGames.map((game) => <GameCard game={game} key={game.slug} />)}</div>
      ) : (
        <div className="empty-state"><span aria-hidden="true">{view === "recent" ? "↶" : "♡"}</span><h2>{view === "recent" ? "Your next run starts here." : "Save the games you love."}</h2><p>{view === "recent" ? "Games appear here after you open their player." : "Use the heart button on any game card to build a collection."}</p><Link className="primary-button" href="/games">Browse games</Link></div>
      )}
    </section>
  );
}
