import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Developers",
  description: "Technical, quality, and licensing guidance for publishing a game on JoyCircuit.",
};

export default function DevelopersPage() {
  return (
    <InfoPage
      title="Bring your game to JoyCircuit."
      description="We are looking for polished HTML5 games that load quickly, play well in a browser, and come with clear publishing rights."
    >
      <section className="info-grid" aria-label="Developer submission overview">
        <article className="info-card">
          <h2>A complete build</h2>
          <p>
            Submit a production-ready HTTPS build or self-contained web package,
            plus controls, device support, and age guidance.
          </p>
        </article>
        <article className="info-card">
          <h2>Original presentation</h2>
          <p>
            Include a short description and high-resolution artwork you created
            or have permission to license for promotion.
          </p>
        </article>
        <article className="info-card">
          <h2>Player-friendly behavior</h2>
          <p>
            Games must avoid forced redirects, surprise pop-ups, autoplaying
            audio, hidden trackers, and misleading controls.
          </p>
        </article>
      </section>

      <section className="prose" aria-labelledby="developer-package">
        <h2 id="developer-package">What to prepare</h2>
        <ul>
          <li>Game title, studio name, description, instructions, and content notes.</li>
          <li>Supported browsers, input methods, orientation, and preferred aspect ratio.</li>
          <li>An HTTPS build URL or packaged HTML5 build with a clear entry file.</li>
          <li>Original cover art, thumbnails, and an optional short gameplay clip.</li>
          <li>A support contact and release notes for future build updates.</li>
        </ul>

        <h2>Licensing and ownership</h2>
        <p>
          You must own the game or be authorized to publish it. Be ready to show
          who owns the game and to document the platforms, territories, term,
          promotional artwork rights, and monetization rights covered by the
          license. Music, fonts, trademarks, characters, code, and third-party
          assets must also be cleared for this use.
        </p>
        <p>
          We do not accept copied portal builds, unlicensed assets, confusingly
          similar branding, or a build submitted by someone who cannot grant
          publishing permission. Rights are checked before release and may be
          checked again when a build changes.
        </p>

        <h2 id="standards">Technical review</h2>
        <p>
          A submitted game should resize without clipping, expose working pause
          and mute behavior where relevant, recover from loading errors, and stay
          inside its player frame. We review performance, browser console errors,
          keyboard access, mobile usability, content safety, and network requests.
        </p>

        <h2>How review works</h2>
        <ol>
          <li>Send the build, game details, artwork, and rights documentation.</li>
          <li>We complete a quality, safety, compatibility, and licensing review.</li>
          <li>Accepted games receive a listing draft for creator approval.</li>
          <li>Launch timing and any commercial terms are agreed in writing.</li>
        </ol>
        <p>
          Public submissions are not open during this preview. You can still use
          this checklist to prepare a compliant build, then return when creator
          intake opens. For an existing listing or rights concern, use the
          <Link href="/support"> support guide</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
