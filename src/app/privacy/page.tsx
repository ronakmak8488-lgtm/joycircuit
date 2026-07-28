import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How JoyCircuit handles browser storage, play activity, reports, and technical data.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy, in plain language."
      description="JoyCircuit uses a small amount of data to remember your library, run games, keep the service secure, and investigate reports."
    >
      <section className="info-grid" aria-label="Privacy summary">
        <article className="info-card">
          <h2>Your library stays local</h2>
          <p>
            Guest favorites and recent games are stored in your browser, where
            you can remove them by clearing JoyCircuit site data.
          </p>
        </article>
        <article className="info-card">
          <h2>No sale of personal data</h2>
          <p>
            We do not sell personal information or use it to build cross-site
            advertising profiles.
          </p>
        </article>
        <article className="info-card">
          <h2>Reports stay focused</h2>
          <p>
            Problem reports are used to investigate the issue, protect players,
            and communicate with a reporting creator when necessary.
          </p>
        </article>
      </section>

      <section className="prose" aria-labelledby="privacy-details">
        <p><strong>Last updated:</strong> July 21, 2026</p>

        <h2 id="privacy-details">Data we handle</h2>
        <p>
          The guest library stores favorite game identifiers, recently played
          game identifiers and times, and a random anonymous browser identifier
          in local storage. When you play a game or submit a report, JoyCircuit
          may receive the game identifier, event time, report details, and that
          anonymous identifier. Our hosting and security systems may also process
          standard request data such as IP address, browser type, and error logs.
        </p>

        <h2>Why we use it</h2>
        <p>
          We use this information to provide the library and player, understand
          whether core features work, prevent abuse, debug failures, respond to
          safety or rights reports, and meet legal obligations. We do not use
          guest activity for cross-site advertising.
        </p>

        <h2>Sharing and retention</h2>
        <p>
          We share information only with service providers that host, secure, or
          support JoyCircuit; with game publishers when needed to resolve a
          specific technical or rights issue; or when required by law. Local
          library data remains until you clear it. Server logs and reports are
          retained only as long as reasonably needed for operations, security,
          dispute handling, and legal compliance.
        </p>

        <h2>Your choices</h2>
        <p>
          You can clear local data in your browser settings, block site storage,
          or use private browsing, although library features may then stop
          working. Use <Link href="/support">support</Link> for an access,
          correction, deletion, or rights-related request and include enough
          information for us to verify it safely.
        </p>

        <h2>Children and policy changes</h2>
        <p>
          Players who are not old enough to consent to online services where they
          live should use JoyCircuit only with a parent or guardian. If we learn
          that information was collected from a child contrary to applicable law,
          we will take appropriate steps to remove it. Material policy changes
          will be explained on this page before they take effect when practical.
        </p>

        <p>
          Read the <Link href="/cookies">cookies and storage notice</Link> for
          more detail about browser storage.
        </p>
      </section>
    </InfoPage>
  );
}
