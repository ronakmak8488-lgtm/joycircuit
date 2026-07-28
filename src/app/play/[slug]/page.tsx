import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameRail } from "@/components/game-rail";
import { PlayerShell } from "@/components/player-shell";
import { getAllGames, getGameBySlug } from "@/lib/games";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PlayerPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  return { title: `Play ${game.title}`, description: game.tagline };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;
  const [game, games] = await Promise.all([getGameBySlug(slug), getAllGames()]);
  if (!game) notFound();
  const related = games.filter((candidate) => candidate.slug !== game.slug && candidate.categories.some((category) => game.categories.includes(category))).slice(0, 5);
  const headingLabels = [...(game.tags.includes("3d") ? ["3D"] : []), ...game.categories];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    gamePlatform: "Web browser",
    applicationCategory: "Game",
    genre: game.categories,
    author: { "@type": "Organization", name: game.developer.name },
  };

  return (
    <main id="main-content" className="page-shell player-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="player-heading"><div><p>{headingLabels.join(" · ")}</p><h1>{game.title}</h1><span>{game.tagline}</span></div><div className="player-inputs">{game.inputModes.map((mode) => <span key={mode}><span className="sr-only">Input: </span>{mode}</span>)}</div></header>
      <PlayerShell game={game} />
      <section className="game-details" aria-labelledby="about-game-title">
        <div className="prose"><h2 id="about-game-title">About the game</h2><p>{game.description}</p><h3>How to play</h3><p>{game.instructions}</p></div>
        <aside className="game-facts"><h2>Game details</h2><dl><div><dt>Developer</dt><dd>{game.developer.name}</dd></div><div><dt>Age guidance</dt><dd>{game.ageRating}</dd></div><div><dt>Mode</dt><dd>{game.multiplayerMode}</dd></div><div><dt>License</dt><dd><Link href={game.license.proofUrl}>{game.license.type}</Link></dd></div></dl></aside>
      </section>
      <GameRail id="related-games-title" title="Keep the run going" description="More games picked from the same circuit." games={related.length > 0 ? related : games.slice(0, 5)} href="/games" />
    </main>
  );
}
