import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@/app/globals.css";
import { AmbientGameField } from "@/components/ambient-game-field";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "JoyCircuit — Play original browser games", template: "%s · JoyCircuit" },
  description: "Discover and instantly play original browser games. No downloads and no autoplaying sound.",
  applicationName: "JoyCircuit",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "JoyCircuit",
    description: "Find your next favorite browser game.",
    type: "website",
    siteName: "JoyCircuit",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#08111F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AmbientGameField />
        <a className="skip-link" href="#main-content">Skip to games</a>
        <Suspense fallback={<div className="site-header" aria-hidden="true" />}>
          <SiteHeader />
        </Suspense>
        {children}
        <SiteFooter />
        <Suspense fallback={null}>
          <MobileTabBar />
        </Suspense>
      </body>
    </html>
  );
}
