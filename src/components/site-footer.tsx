import Link from "next/link";
import { Brand } from "@/components/brand";

const COLUMNS = [
  { title: "Explore", links: [["All games", "/games"], ["New releases", "/games?sort=newest"], ["Multiplayer", "/category/multiplayer"], ["Categories", "/games"]] },
  { title: "For creators", links: [["Submission checklist", "/developers#developer-package"], ["Developer guide", "/developers"], ["Content standards", "/developers#standards"]] },
  { title: "JoyCircuit", links: [["About", "/about"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell">
        <div className="footer-grid">
          <div><Brand /><p>Original browser games, instantly playable. Find a favorite, invite a friend, and keep the good runs going.</p></div>
          {COLUMNS.map((column) => <div key={column.title}><h2>{column.title}</h2>{column.links.map(([label, href]) => <Link href={href} key={`${label}-${href}`}>{label}</Link>)}</div>)}
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} JoyCircuit</span><span>Play responsibly · No autoplaying sound</span></div>
      </div>
    </footer>
  );
}
