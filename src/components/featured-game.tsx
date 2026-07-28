import Link from "next/link";
import { GameArt } from "@/components/game-art";
import { PlayIcon } from "@/components/icons";
import type { Game } from "@/lib/types";

export function FeaturedGame({ game }: { game: Game }) {
  return (
    <article className="featured-game">
      <GameArt slug={game.slug} title={game.title} tags={game.tags} className="featured-art" decorative />
      <span className="feature-orbit" aria-hidden="true" />
      <div className="featured-copy">
        <div className="game-meta">
          <span>{game.categories[0] ?? "Racing"}</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>{game.inputModes[0] ?? "Keyboard"}</span>
        </div>
        <h1>{game.title}</h1>
        <p>{game.tagline}</p>
        <Link className="primary-button" href={`/play/${game.slug}`}>
          <span className="button-icon"><PlayIcon size={18} /></span>
          Play now
        </Link>
      </div>
    </article>
  );
}
