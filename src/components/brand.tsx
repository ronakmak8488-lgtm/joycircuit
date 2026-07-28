import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="JoyCircuit home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" width="24" height="24">
          <path d="M10 9h12v12a7 7 0 0 1-14 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="24" cy="9" r="3" fill="currentColor" />
        </svg>
      </span>
      {compact ? null : <span>JoyCircuit</span>}
    </Link>
  );
}
