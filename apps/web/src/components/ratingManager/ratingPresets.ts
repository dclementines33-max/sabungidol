// Rating Manager presets (PRD §6.6). Each returns idol → new rating for the draft; nothing is saved.
import { matchRng } from "@sabung/engine";

type Idol = { id: string; rating: number; seed: number | null };
const SEED_RATING: Record<number, number> = { 1: 88, 2: 80, 3: 72, 4: 64 };

// Seed 1 = 88, 2 = 80, 3 = 72, 4 = 64, optionally ± a random 0–3. Idols without seed 1–4 are left alone.
export function seedPresets(idols: Idol[], jitter: boolean, random = Math.random): Map<string, number> {
  const out = new Map<string, number>();
  for (const i of idols) {
    const base = i.seed ? SEED_RATING[i.seed] : undefined;
    if (base !== undefined) out.set(i.id, base + (jitter ? Math.round(random() * 6 - 3) : 0));
  }
  return out;
}

// Normal distribution μ 72, σ 9, handed out in the current rating order (the best stays the best).
export function realisticVariety(idols: Idol[], seed = String(Date.now())): Map<string, number> {
  const rng = matchRng(seed, "realistic-variety");
  const values = idols.map(() => Math.max(1, Math.min(100, Math.round(72 + rng.normal(9))))).sort((a, b) => b - a);
  const order = [...idols].sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
  return new Map(order.map((i, n) => [i.id, values[n]!]));
}

export const resetAll = (idols: Idol[]) => new Map(idols.map((i) => [i.id, 75]));
