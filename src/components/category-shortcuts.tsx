import Link from "next/link";
import { BallIcon, BoltIcon, ChessIcon, LeafIcon, PuzzleIcon, UsersIcon, WheelIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";

const CATEGORIES = [
  { slug: "action", label: "Action", Icon: BoltIcon },
  { slug: "racing", label: "Racing", Icon: WheelIcon },
  { slug: "puzzle", label: "Puzzle", Icon: PuzzleIcon },
  { slug: "sports", label: "Sports", Icon: BallIcon },
  { slug: "strategy", label: "Strategy", Icon: ChessIcon },
  { slug: "cozy", label: "Cozy", Icon: LeafIcon },
  { slug: "multiplayer", label: "Multiplayer", Icon: UsersIcon },
];

export function CategoryShortcuts() {
  return (
    <section className="page-section" aria-labelledby="categories-title">
      <SectionHeading id="categories-title" title="Find your kind of fun" description="Jump into a category." />
      <div className="category-shortcuts">
        {CATEGORIES.map(({ slug, label, Icon }) => (
          <Link href={`/category/${slug}`} key={slug}><Icon size={25} /><span>{label}</span></Link>
        ))}
      </div>
    </section>
  );
}
