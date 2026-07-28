import type { CSSProperties } from "react";

const ART_KEYS: Record<string, string> = {
  "neon-kestrel-drift": "drift",
  "moonbug-rally": "moon",
  "tumbletower-trials": "blocks",
  "astro-alley-strikers": "astro",
  "pebble-pop-lab": "pebble",
  "hex-garden": "hex",
  "skyhook-sprint": "sky",
  "tiny-titan-tactics": "titan",
  "marshmallow-mech": "mech",
  "vault-of-vines": "vines",
  "comet-kitchen": "kitchen",
  shadowboard: "shadow",
};

type GameArtProps = {
  slug: string;
  title: string;
  tags?: string[];
  className?: string;
  decorative?: boolean;
};

function hashSlug(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function GameArt({ slug, title, tags = [], className = "", decorative = false }: GameArtProps) {
  const key = ART_KEYS[slug];
  const generated = !key;
  const hash = hashSlug(slug);
  const style = generated
    ? ({
        "--art-hue": hash % 360,
        "--art-hue-two": (hash * 7 + 92) % 360,
        "--art-turn": `${(hash % 31) - 15}deg`,
      } as CSSProperties)
    : undefined;
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  const is3d = tags.includes("3d");

  return (
    <div
      className={`game-art ${generated ? "art-generated" : `art-${key}`} ${is3d ? "is-3d-art" : ""} ${className}`.trim()}
      style={style}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : `${title} original game artwork`}
    >
      <span className="art-shape art-shape-one" aria-hidden="true" />
      <span className="art-shape art-shape-two" aria-hidden="true" />
      {generated ? <span className="art-monogram" aria-hidden="true">{initials}</span> : null}
      {is3d ? <span className="art-dimension" aria-hidden="true">3D</span> : null}
    </div>
  );
}
