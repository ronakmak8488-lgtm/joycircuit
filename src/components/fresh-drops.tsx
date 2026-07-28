import Link from "next/link";
import { GameArt } from "@/components/game-art";
import { PlayIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import type { Game } from "@/lib/types";

export function FreshDrops({ games }: { games: Game[] }) {
  return (
    <section className="page-section content-visibility" aria-labelledby="fresh-drops-title">
      <SectionHeading id="fresh-drops-title" title="Fresh drops" description="New worlds, hand-picked every week." href="/games?sort=newest" linkLabel="Browse new games" />
      <div className="fresh-grid">
        {games.slice(0, 4).map((game, index) => (
          <Link className="fresh-card" href={`/play/${game.slug}`} key={game.slug}>
            <GameArt slug={game.slug} title={game.title} tags={game.tags} />
            <span className="fresh-label">
              <span><strong>{game.title}</strong><small>{game.tagline}</small></span>
              {index === 0 || index === 3 ? <span className="circle-play"><PlayIcon size={18} /></span> : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
