import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { getAllGames } from "@/lib/games";

export const metadata: Metadata = { title: "Search games" };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchPageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [{ q = "" }, games] = await Promise.all([searchParams, getAllGames()]);
  return (
    <main id="main-content" className="page-shell inner-main">
      <header className="page-title"><p>Search</p><h1>{q ? `Results for “${q}”` : "Find a game"}</h1><span>Search titles, genres, and play styles.</span></header>
      <CatalogExplorer games={games} initialQuery={q} />
    </main>
  );
}
