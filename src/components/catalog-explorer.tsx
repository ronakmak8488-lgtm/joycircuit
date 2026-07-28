"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { SearchIcon, SlidersIcon } from "@/components/icons";
import type { Game } from "@/lib/types";

type CatalogExplorerProps = {
  games: Game[];
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: string;
  initialExperience?: string;
};

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function CatalogExplorer({ games, initialQuery = "", initialCategory = "all", initialSort = "featured", initialExperience = "all" }: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory.toLowerCase());
  const [input, setInput] = useState("all");
  const [experience, setExperience] = useState(initialExperience);
  const [multiplayer, setMultiplayer] = useState("all");
  const [sort, setSort] = useState(initialSort);
  const deferredQuery = useDeferredValue(normalized(query));

  const categories = useMemo(() => Array.from(new Set(games.flatMap((game) => game.categories))).toSorted(), [games]);
  const inputs = useMemo(() => Array.from(new Set(games.flatMap((game) => game.inputModes))).toSorted(), [games]);

  const filtered = useMemo(() => {
    const matches = games.filter((game) => {
      const haystack = normalized([game.title, game.tagline, game.categories.join(" "), game.tags.join(" ")].join(" "));
      const matchesQuery = !deferredQuery || haystack.includes(deferredQuery);
      const matchesCategory = category === "all" || game.categories.some((item) => normalized(item) === category);
      const matchesInput = input === "all" || game.inputModes.some((item) => normalized(item) === input);
      const is3d = game.tags.includes("3d");
      const matchesExperience = experience === "all" || (experience === "3d" ? is3d : !is3d);
      const isMultiplayer = !["solo", "single", "none", "single-player"].includes(normalized(game.multiplayerMode));
      const matchesMultiplayer = multiplayer === "all" || (multiplayer === "yes" ? isMultiplayer : !isMultiplayer);
      return matchesQuery && matchesCategory && matchesInput && matchesExperience && matchesMultiplayer;
    });

    return matches.toSorted((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "newest") return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
      return (a.featuredRank ?? 999) - (b.featuredRank ?? 999);
    });
  }, [category, deferredQuery, experience, games, input, multiplayer, sort]);

  return (
    <div className="catalog-explorer">
      <div className="catalog-controls" aria-label="Game filters">
        <label className="catalog-search">
          <span className="sr-only">Filter games</span>
          <SearchIcon size={18} />
          <input type="search" value={query} placeholder="Filter this collection" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="filter-icon" aria-hidden="true"><SlidersIcon size={19} /></div>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option value={normalized(item)} key={item}>{item}</option>)}</select></label>
        <label><span>Input</span><select value={input} onChange={(event) => setInput(event.target.value)}><option value="all">Any input</option>{inputs.map((item) => <option value={normalized(item)} key={item}>{item}</option>)}</select></label>
        <label><span>Experience</span><select value={experience} onChange={(event) => setExperience(event.target.value)}><option value="all">2D + 3D</option><option value="3d">3D worlds</option><option value="2d">2D arcade</option></select></label>
        <label><span>Players</span><select value={multiplayer} onChange={(event) => setMultiplayer(event.target.value)}><option value="all">Any mode</option><option value="yes">Multiplayer</option><option value="no">Solo</option></select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="title">A–Z</option></select></label>
      </div>
      <div className="result-summary" aria-live="polite"><strong>{filtered.length}</strong> {filtered.length === 1 ? "game" : "games"}</div>
      {filtered.length > 0 ? (
        <div className="catalog-grid">{filtered.map((game) => <GameCard game={game} key={game.slug} />)}</div>
      ) : (
        <div className="empty-state"><span aria-hidden="true">⌁</span><h2>No games match those filters.</h2><p>Try a broader search or reset one of the filters above.</p></div>
      )}
    </div>
  );
}
