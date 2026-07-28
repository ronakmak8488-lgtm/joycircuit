import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="page-shell status-page">
      <span aria-hidden="true">404</span><h1>This level is off the map.</h1><p>The game or page may have moved.</p><Link className="primary-button" href="/games">Browse games</Link>
    </main>
  );
}
