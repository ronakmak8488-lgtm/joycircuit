import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Cookies and Storage",
  description: "How JoyCircuit uses local browser storage and essential technology.",
};

export default function CookiesPage() {
  return (
    <InfoPage
      title="Cookies and browser storage."
      description="JoyCircuit currently uses local browser storage for guest features. It does not use advertising cookies or cross-site tracking."
    >
      <section className="info-grid" aria-label="Browser storage summary">
        <article className="info-card">
          <h2>Library storage</h2>
          <p>
            Saves your favorite game identifiers and up to 24 recent plays so
            they remain available after a reload.
          </p>
        </article>
        <article className="info-card">
          <h2>Anonymous identifier</h2>
          <p>
            Creates a random browser identifier used to associate guest play
            events and reports without asking for an account.
          </p>
        </article>
        <article className="info-card">
          <h2>No ad profiles</h2>
          <p>
            JoyCircuit does not currently place advertising cookies or use site
            activity to follow you across unrelated services.
          </p>
        </article>
      </section>

      <section className="prose" aria-labelledby="storage-details">
        <p><strong>Last updated:</strong> July 21, 2026</p>

        <h2 id="storage-details">What is stored</h2>
        <p>
          Local storage is a browser feature similar to cookies, but its values
          are not automatically sent with every web request. JoyCircuit stores a
          versioned library record under <code>joycircuit:library:v1</code> and a
          random guest identifier under <code>joycircuit:anonymous:v1</code>.
          These values are used for recent games, favorites, and basic guest
          continuity.
        </p>

        <h2>How long it remains</h2>
        <p>
          These records remain in the browser until you clear site data, the
          browser removes them, or JoyCircuit replaces them with a newer format.
          Private-browsing windows commonly remove storage when the session ends.
        </p>

        <h2>How to manage it</h2>
        <p>
          Use your browser’s privacy or site-data settings to inspect, block, or
          remove JoyCircuit storage. Blocking storage will not prevent basic page
          browsing, but favorites, recent games, and some report or play-session
          features may not work as expected.
        </p>

        <h2>If our use changes</h2>
        <p>
          If JoyCircuit later adds accounts, analytics, advertising, or optional
          personalization that requires additional cookies or storage, this page
          will be updated and consent controls will be provided where required.
          See the <Link href="/privacy">privacy notice</Link> for how related data
          is handled.
        </p>
      </section>
    </InfoPage>
  );
}
