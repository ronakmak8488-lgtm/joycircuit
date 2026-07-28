export interface GameLevel {
  id: number;
  name: string;
  difficulty: number;
}

const TIERS = [
  { threshold: 10, prefix: "Rookie", suffix: "" },
  { threshold: 25, prefix: "Novice", suffix: "" },
  { threshold: 40, prefix: "Apprentice", suffix: "" },
  { threshold: 55, prefix: "Adept", suffix: "" },
  { threshold: 70, prefix: "Expert", suffix: "" },
  { threshold: 85, prefix: "Master", suffix: "" },
  { threshold: 95, prefix: "Legend", suffix: "" },
  { threshold: 100, prefix: "Impossible", suffix: "" },
];

function tierForLevel(level: number): { prefix: string; suffix: string } {
  let tier = TIERS[0];
  for (const candidate of TIERS) {
    if (level <= candidate.threshold) {
      tier = candidate;
      break;
    }
  }
  const withinTier = level - (TIERS[TIERS.indexOf(tier) - 1]?.threshold ?? 0);
  const suffix = tier.prefix === "Impossible" ? ` ${withinTier}` : ` ${withinTier}`;
  return { prefix: tier.prefix, suffix };
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    const char = input.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

export function generateLevels(slug: string): GameLevel[] {
  const seed = hashString(`${slug}:levels`);
  const random = seededRandom(seed);
  const levels: GameLevel[] = [];

  for (let index = 1; index <= 100; index += 1) {
    const { prefix, suffix } = tierForLevel(index);
    const jitter = Math.floor(random() * 3) - 1;
    const displayNumber = Math.max(1, index + jitter);
    levels.push({
      id: index,
      name: `${prefix}${suffix} · ${displayNumber}`,
      difficulty: Math.round((index / 100) * 100),
    });
  }

  return levels;
}

export function getLevelById(levels: GameLevel[], levelId: number): GameLevel | null {
  return levels.find((level) => level.id === levelId) ?? null;
}
