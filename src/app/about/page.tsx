import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "About",
  description: "Meet the people-first idea behind JoyCircuit's instant browser games.",
};

export default function AboutPage() {
  return (
    <InfoPage
      title="Play should be the easy part."
      description="JoyCircuit is a fast, friendly home for original browser games—built to get you from curious to playing in a few seconds."
    >
      <section className="info-grid" aria-label="What defines JoyCircuit">
        <article className="info-card">
          <h2>Instant by default</h2>
          <p>
            No downloads or complicated setup. Pick a game, learn the controls,
            and jump in.
          </p>
        </article>
        <article className="info-card">
          <h2>Curated with care</h2>
          <p>
            Every title should be fun, technically sound, and published with
            clear permission from its creator.
          </p>
        </article>
        <article className="info-card">
          <h2>Made for everyone</h2>
          <p>
            Responsive controls, keyboard-friendly navigation, readable pages,
            and no surprise autoplaying sound.
          </p>
        </article>
      </section>

      <section className="prose" aria-labelledby="about-mission">
        <h2 id="about-mission">A smaller, more thoughtful game shelf</h2>
        <p>
          JoyCircuit favors clear recommendations and distinct games over an
          endless wall of lookalike thumbnails. Your recent plays and favorites
          stay close, while discovery remains simple enough for a first visit.
        </p>
        <h2 id="content-rights">Original games deserve a good stage</h2>
        <p>
          We want creators to receive visible credit, accurate game details, and
          a player experience that respects their work. Building something fun?
          Read our <Link href="/developers">developer guide</Link> to learn what
          we look for.
        </p>
      </section>
    </InfoPage>
  );
}
