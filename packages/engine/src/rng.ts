// Seeded random numbers (PRD §5.4): same season seed + match id (+ salt) = same results.

export type Rng = {
  next(): number; // uniform in [0, 1)
  normal(sigma: number): number; // mean 0, standard deviation sigma
};

// FNV-1a: turns a text into a 32-bit number.
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

// mulberry32: small, fast, good enough for a game simulator.
function createRng(seed: number): Rng {
  let a = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Box–Muller; 1 - next() keeps log() away from 0.
  const normal = (sigma: number) => sigma * Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  return { next, normal };
}

// salt > 0 = "Re-roll": a new, recorded variation of the same match.
export function matchRng(seasonSeed: string, matchId: string, salt = 0): Rng {
  return createRng(hash(`${seasonSeed}|${matchId}|${salt}`));
}
