import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogExplorer } from "@/components/catalog-explorer";
import { getAllGames, getGamesByCategory } from "@/lib/games";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CategoryPageProps = { params: Promise<{ slug: string }> };

function titleCase(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${titleCase(slug)} games`, description: `Play original ${titleCase(slug).toLowerCase()} browser games on JoyCircuit.` };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [categoryGames, allGames] = await Promise.all([getGamesByCategory(slug), getAllGames()]);
  if (categoryGames.length === 0) notFound();
  const title = titleCase(slug);

  return (
    <main id="main-content" className="page-shell inner-main">
      <header className="page-title"><p>Collection</p><h1>{title} games</h1><span>{categoryGames.length} hand-picked ways to play.</span></header>
      <CatalogExplorer games={allGames} initialCategory={slug} />
    </main>
  );
}
