import Link from "next/link";

export function MultiplayerFeature() {
  return (
    <section className="page-section multiplayer-feature content-visibility" aria-labelledby="multiplayer-title">
      <div className="multiplayer-copy">
        <h2 id="multiplayer-title">Better with your crew.</h2>
        <p>Make a room, share the link, and start playing together. No download and no complicated setup.</p>
        <Link className="secondary-button" href="/category/multiplayer">Explore multiplayer</Link>
      </div>
      <div className="player-tiles" aria-hidden="true"><span>J</span><span>O</span><span>Y</span></div>
    </section>
  );
}
