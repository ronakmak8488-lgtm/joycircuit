import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using JoyCircuit and its browser-game catalog.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Fair play, clear terms."
      description="These terms set the basic rules for using JoyCircuit, playing its games, and contributing content to the platform."
    >
      <section className="info-grid" aria-label="Terms summary">
        <article className="info-card">
          <h2>Play responsibly</h2>
          <p>
            Do not disrupt the service, bypass safeguards, cheat shared systems,
            or use JoyCircuit to harm another person.
          </p>
        </article>
        <article className="info-card">
          <h2>Creators keep ownership</h2>
          <p>
            Games, artwork, names, and other creative material remain owned by
            their respective creators and licensors.
          </p>
        </article>
        <article className="info-card">
          <h2>The catalog can change</h2>
          <p>
            Games may be updated, restricted, or removed for quality, safety,
            licensing, technical, or legal reasons.
          </p>
        </article>
      </section>

      <section className="prose" aria-labelledby="terms-acceptance">
        <p><strong>Last updated:</strong> July 21, 2026</p>

        <h2 id="terms-acceptance">Accepting these terms</h2>
        <p>
          By using JoyCircuit, you agree to these terms and our <Link href="/privacy">privacy notice</Link>.
          If you are not legally able to agree where you live, a parent or
          guardian must agree for you. Stop using the service if you do not accept
          these terms.
        </p>

        <h2>Your permission to use JoyCircuit</h2>
        <p>
          We give you a personal, limited, non-exclusive, revocable permission to
          access JoyCircuit and play available games for lawful, non-commercial
          entertainment. This does not transfer ownership or permit you to copy,
          sell, rehost, reverse engineer, or redistribute the platform or a game
          unless its owner expressly allows it.
        </p>

        <h2>Acceptable use</h2>
        <p>
          You may not interfere with the service, probe or bypass security,
          automate abusive traffic, upload malicious code, manipulate reports or
          play activity, impersonate others, infringe intellectual property, or
          use JoyCircuit in violation of law. We may restrict access or remove
          content while investigating suspected misuse.
        </p>

        <h2>Games and creator submissions</h2>
        <p>
          Individual games may have additional creator terms. Developers who
          submit material confirm that it is accurate, safe to distribute, and
          covered by all permissions needed for hosting, promotion, and agreed
          monetization. Submission does not guarantee acceptance, placement,
          payment, or continued availability. Commercial and licensing terms must
          be agreed separately in writing.
        </p>

        <h2>Availability and responsibility</h2>
        <p>
          We work to keep JoyCircuit reliable, but the service and games are
          provided as available and may contain errors or become unavailable.
          To the extent permitted by law, JoyCircuit is not responsible for
          indirect or unforeseeable loss caused by using—or being unable to
          use—the service. Nothing here limits rights or remedies that cannot
          legally be limited.
        </p>

        <h2>Changes and concerns</h2>
        <p>
          We may update these terms as JoyCircuit changes. Material updates will
          be dated and communicated reasonably before they take effect when
          practical. For a rights concern, takedown request, or question about
          these terms, follow the instructions on <Link href="/support">support</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
