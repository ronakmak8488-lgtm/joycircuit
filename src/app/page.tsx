import { CategoryShortcuts } from "@/components/category-shortcuts";
import { ContinuePlaying } from "@/components/continue-playing";
import { FeaturedGame } from "@/components/featured-game";
import { FreshDrops } from "@/components/fresh-drops";
import { GameRail } from "@/components/game-rail";
import { MultiplayerFeature } from "@/components/multiplayer-feature";
import { QuickPlay } from "@/components/quick-play";
import { getAllGames, getFeaturedGame } from "@/lib/games";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QUICK_SLUGS = ["moonbug-rally", "tumbletower-trials", "hex-garden", "skyhook-sprint"];
const TRENDING_SLUGS = ["astro-alley-strikers", "tiny-titan-tactics", "pebble-pop-lab", "marshmallow-mech", "shadowboard"];
const FRESH_SLUGS = ["vault-of-vines", "comet-kitchen", "moonbug-rally", "neon-kestrel-drift"];
const COZY_SLUGS = ["hex-garden", "comet-kitchen", "tumbletower-trials", "pebble-pop-lab", "vault-of-vines"];

export default async function HomePage() {
  const [games, featured] = await Promise.all([getAllGames(), getFeaturedGame()]);
  const bySlug = new Map(games.map((game) => [game.slug, game]));
  const select = (slugs: string[]) => slugs.flatMap((slug) => {
    const game = bySlug.get(slug);
    return game ? [game] : [];
  });
  const heroGame = featured ?? games[0];
  const arcadeGames = games
    .filter((game) => game.status === "new" && game.embedUrl?.startsWith("/games/joy-arcade/"))
    .slice(0, 5);
  const immersiveGames = games.filter((game) => game.tags.includes("3d")).slice(0, 5);

  return (
    <main id="main-content" className="page-shell home-main">
      <section className="hero-grid" aria-label="Featured games">
        <FeaturedGame game={heroGame} />
        <QuickPlay games={select(QUICK_SLUGS)} />
      </section>
      <ContinuePlaying games={games} />
      <GameRail id="trending-title" title="Trending now" description="Games people keep coming back to." games={select(TRENDING_SLUGS)} />
      <CategoryShortcuts />
      {arcadeGames.length > 0 ? (
        <GameRail id="arcade-expansion-title" title="Fresh arcade worlds" description="New original challenges, built for a fast first run and a better second one." games={arcadeGames} href="/games" linkLabel="Browse all" />
      ) : null}
      {immersiveGames.length > 0 ? (
        <GameRail id="three-d-title" title="Step into 3D" description="Interactive worlds with real 3D models, built to play instantly." games={immersiveGames} href="/games?experience=3d" linkLabel="Explore 3D" />
      ) : null}
      <FreshDrops games={select(FRESH_SLUGS)} />
      <MultiplayerFeature />
      <GameRail id="cozy-title" title="Cozy & clever" description="Slow down, solve something satisfying." games={select(COZY_SLUGS)} href="/category/cozy" linkLabel="See collection" />
    </main>
  );
}
