import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { getAllGames } from "@/lib/games";

export const metadata: Metadata = { title: "Browse games", description: "Browse every original JoyCircuit browser game." };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GamesPageProps = { searchParams: Promise<{ sort?: string; experience?: string }> };

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const [{ sort = "featured", experience = "all" }, games] = await Promise.all([searchParams, getAllGames()]);
  const playableCount = games.filter((game) => game.embedUrl).length;
  const initialExperience = ["all", "2d", "3d"].includes(experience) ? experience : "all";
  return (
    <main id="main-content" className="page-shell inner-main">
      <header className="page-title"><p>All games</p><h1>Pick a world. Start playing.</h1><span>{playableCount} games are ready to play now, including original 2D challenges and interactive 3D worlds.</span></header>
      <CatalogExplorer games={games} initialSort={sort} initialExperience={initialExperience} />
    </main>
  );
}
