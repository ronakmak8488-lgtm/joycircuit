import Link from "next/link";
import { GameArt } from "@/components/game-art";
import type { Game } from "@/lib/types";

export function QuickPlay({ games }: { games: Game[] }) {
  return (
    <aside className="quick-panel" aria-labelledby="quick-play-title">
      <h2 id="quick-play-title">Quick play</h2>
      <p>Four great picks. Zero setup.</p>
      <div className="quick-grid">
        {games.slice(0, 4).map((game) => (
          <Link className="quick-card" href={`/play/${game.slug}`} key={game.slug}>
            <GameArt slug={game.slug} title={game.title} tags={game.tags} />
            <h3>{game.title}</h3>
            <p>{game.categories[0] ?? "Arcade"}</p>
          </Link>
        ))}
      </div>
    </aside>
  );
}
