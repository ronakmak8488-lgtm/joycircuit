import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Support",
  description: "Troubleshooting and reporting help for JoyCircuit players and developers.",
};

export default function SupportPage() {
  return (
    <InfoPage
      title="Let’s get you back in the game."
      description="Try the quick checks below, then send a report from the game page if the problem continues."
    >
      <section className="info-grid" aria-label="Common support topics">
        <article className="info-card">
          <h2>A game will not load</h2>
          <p>
            Refresh once, check your connection, then temporarily disable a
            content blocker for JoyCircuit and try again.
          </p>
        </article>
        <article className="info-card">
          <h2>Sound or fullscreen</h2>
          <p>
            Start the game before enabling sound. If fullscreen is blocked, allow
            it when your browser asks and retry from the player controls.
          </p>
        </article>
        <article className="info-card">
          <h2>Recent games or favorites</h2>
          <p>
            These are saved in this browser. Private browsing, blocked storage,
            or clearing site data can remove them.
          </p>
        </article>
      </section>

      <section className="prose" aria-labelledby="support-checks">
        <h2 id="support-checks">Before reporting a problem</h2>
        <ol>
          <li>Update your browser and reload the game page.</li>
          <li>Confirm the same issue happens after restarting the game.</li>
          <li>Try without browser extensions that change scripts, sound, or networking.</li>
          <li>Note the game name, device, browser, and what you expected to happen.</li>
        </ol>

        <h2>Report a game</h2>
        <p>
          Use the <strong>Report</strong> control on the game page for broken
          gameplay, inappropriate content, suspicious behavior, or a rights
          concern. Include only the details needed to investigate—never send a
          password, payment information, or another person’s private data.
        </p>

        <h2>For game creators</h2>
        <p>
          Public creator intake is not open during this preview. For an existing
          listing, use its <strong>Report</strong> control for attribution,
          takedown, or rights concerns and include only the information needed to
          verify the request. Future publishers can prepare with the
          <Link href="/developers"> developer guide</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
