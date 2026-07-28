import type { Metadata } from "next";
import { LibraryView } from "@/components/library-view";
import { getAllGames } from "@/lib/games";

export const metadata: Metadata = { title: "Your library", description: "Your recently played and favorite JoyCircuit games." };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LibraryPageProps = { searchParams: Promise<{ view?: string }> };

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const [{ view }, games] = await Promise.all([searchParams, getAllGames()]);
  const initialView = view === "favorites" ? "favorites" : "recent";
  return (
    <main id="main-content" className="page-shell inner-main">
      <header className="page-title"><p>Your library</p><h1>Pick up where you left off.</h1><span>Recent games and favorites stay on this device—no account required.</span></header>
      <LibraryView games={games} initialView={initialView} />
    </main>
  );
}
