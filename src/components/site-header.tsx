"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { ArrowLeftIcon, CloseIcon, HeartIcon, MenuIcon } from "@/components/icons";
import { SearchBox } from "@/components/search-box";
import { SoundscapeControl } from "@/components/soundscape-control";

const NAV_ITEMS = [
  { href: "/", label: "Discover" },
  { href: "/games", label: "Browse" },
  { href: "/category/multiplayer", label: "Multiplayer" },
  { href: "/games?sort=newest", label: "New" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Brand />
        <nav className={`primary-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isNewest = pathname === "/games" && searchParams.get("sort") === "newest";
            const active = item.href === "/"
              ? pathname === "/"
              : item.href === "/games?sort=newest"
                ? isNewest
                : item.href === "/games"
                  ? pathname === "/games" && !isNewest
                  : pathname.startsWith(item.href);
            return <Link className={active ? "is-active" : ""} href={item.href} key={item.href} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>{item.label}</Link>;
          })}
        </nav>
        <SearchBox />
        <div className="header-actions">
          <Link className="icon-button ronak-motion-button" href="https://ronak-motion.vercel.app" aria-label="Back to Ronak Motion" title="Back to Ronak Motion">
            <ArrowLeftIcon size={19} />
          </Link>
          <SoundscapeControl />
          <Link className="icon-button library-button" href="/library" aria-label="Open favorites and recent games"><HeartIcon size={19} /></Link>
          <span className="avatar" aria-label="Guest profile">R</span>
          <button
            className="icon-button menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
