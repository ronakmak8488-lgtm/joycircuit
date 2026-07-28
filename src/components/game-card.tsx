import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { GameArt } from "@/components/game-art";
import { PlayIcon } from "@/components/icons";
import type { Game } from "@/lib/types";

type GameCardProps = {
  game: Game;
  compact?: boolean;
  showFavorite?: boolean;
};

export function GameCard({ game, compact = false, showFavorite = true }: GameCardProps) {
  const multiplayer = !["solo", "single", "none"].includes(game.multiplayerMode);
  const state = game.tags.includes("3d") ? "3D" : multiplayer ? "Multi" : game.status === "new" ? "New" : null;

  return (
    <article className={`game-card ${compact ? "game-card-compact" : ""}`}>
      <div className="game-card-media">
        <Link href={`/play/${game.slug}`} aria-label={`Play ${game.title}`}>
          <GameArt slug={game.slug} title={game.title} tags={game.tags} />
          <span className="game-card-play" aria-hidden="true"><PlayIcon size={18} /></span>
        </Link>
        {showFavorite ? <FavoriteButton slug={game.slug} compact /> : null}
      </div>
      <div className="game-card-info">
        <div className="game-card-copy">
          <h3><Link href={`/play/${game.slug}`}>{game.title}</Link></h3>
          <p>{game.categories[0] ?? "Arcade"}</p>
        </div>
        {state ? <span className="game-state">{state}</span> : null}
      </div>
    </article>
  );
}
