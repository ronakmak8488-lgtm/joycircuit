"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GridIcon, HeartIcon, HistoryIcon, HomeIcon } from "@/components/icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/games", label: "Browse", Icon: GridIcon },
  { href: "/library?view=recent", label: "Recent", Icon: HistoryIcon },
  { href: "/library?view=favorites", label: "Favorites", Icon: HeartIcon },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile navigation">
      {TABS.map(({ href, label, Icon }) => {
        const view = searchParams.get("view");
        const active = href === "/"
          ? pathname === "/"
          : href === "/games"
            ? pathname === "/games" || pathname.startsWith("/category/") || pathname === "/search"
            : href.includes("view=recent")
              ? pathname === "/library" && view !== "favorites"
              : pathname === "/library" && view === "favorites";
        return <Link href={href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined} key={href}><Icon size={19} /><span>{label}</span></Link>;
      })}
    </nav>
  );
}
