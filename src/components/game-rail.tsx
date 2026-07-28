import { GameCard } from "@/components/game-card";
import { SectionHeading } from "@/components/section-heading";
import type { Game } from "@/lib/types";

type GameRailProps = {
  id: string;
  title: string;
  description?: string;
  games: Game[];
  href?: string;
  linkLabel?: string;
};

export function GameRail({ id, title, description, games, href = "/games", linkLabel }: GameRailProps) {
  return (
    <section className="page-section content-visibility" aria-labelledby={id}>
      <SectionHeading id={id} title={title} description={description} href={href} linkLabel={linkLabel} />
      <div className="game-rail">
        {games.slice(0, 5).map((game) => <GameCard game={game} key={game.slug} />)}
      </div>
    </section>
  );
}
