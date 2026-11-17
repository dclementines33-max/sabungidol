// Tier List (2026-11-17): starting presets and every change to a list, pure (the page saves the result). An item is in
// at most one tier; an item in no tier waits in the pool.
import { TIERS, tierOf, ulid } from "@sabung/shared";
import type { Kind, TierList, TierRow } from "../../data/userLists";

export const POOL = "pool";
const TONE: Record<string, string> = { "S+": "splus", S: "s", A: "a", B: "b", C: "c", D: "d", F: "f" };
const tierColor = (label: string) => `var(--color-tier-${TONE[label]})`;

// Label colours a user can pick: the tier ramp first, then the brand colours.
export const COLORS = [
  ...TIERS.map((t) => tierColor(t.tier)),
  ...["orchid", "violet", "indigo", "sky", "teal", "sage", "lime", "sand"].map((c) => `var(--color-brand-${c})`),
];

export const PRESETS = {
  classic: { label: "Classic S+ to F", note: "The app's own rating tiers, can fill itself by rating", tiers: TIERS.map((t) => [t.tier, tierColor(t.tier)]) },
  stan: { label: "Stan scale", note: "GOAT down to Who?", tiers: [["GOAT", COLORS[0]], ["Ultimate bias", COLORS[1]], ["Bias", COLORS[2]], ["Fave", COLORS[3]], ["Like", COLORS[4]], ["Who?", COLORS[5]]] },
  simple: { label: "S to D", note: "Five clean rows", tiers: ["S", "A", "B", "C", "D"].map((t) => [t, tierColor(t)]) },
  blank: { label: "Blank", note: "Three rows to rename", tiers: [["Top", COLORS[0]], ["Middle", COLORS[3]], ["Bottom", COLORS[6]]] },
} as const satisfies Record<string, { label: string; note: string; tiers: readonly (readonly [string, string])[] }>;
export type PresetKey = keyof typeof PRESETS;

const row = (label: string, color: string): TierRow => ({ id: ulid(), label, color });

export function newList(kind: Kind, preset: PresetKey, name: string): TierList {
  const tiers = PRESETS[preset].tiers.map(([label, color]) => row(label, color));
  return { id: ulid(), name, kind, tiers, placed: Object.fromEntries(tiers.map((t) => [t.id, []])), updated: Date.now() };
}

// Puts an item into a tier at index (null = the end), or back into the pool.
export function place(list: TierList, item: string, tierId: string, index: number | null): TierList {
  const placed = Object.fromEntries(list.tiers.map((t) => {
    const ids = (list.placed[t.id] ?? []);
    const at = ids.indexOf(item);
    const rest = ids.filter((x) => x !== item);
    if (t.id !== tierId) return [t.id, rest];
    const i = index === null ? rest.length : at >= 0 && at < index ? index - 1 : index;
    rest.splice(Math.max(0, Math.min(i, rest.length)), 0, item);
    return [t.id, rest];
  }));
  return { ...list, placed };
}

export const tierOfItem = (list: TierList, item: string) => list.tiers.find((t) => list.placed[t.id]?.includes(item))?.id ?? POOL;

export const addTier = (list: TierList): TierList => {
  const t = row(`Tier ${list.tiers.length + 1}`, COLORS[(list.tiers.length + 7) % COLORS.length]!);
  return { ...list, tiers: [...list.tiers, t], placed: { ...list.placed, [t.id]: [] } };
};

export const updateTier = (list: TierList, id: string, patch: Partial<Omit<TierRow, "id">>): TierList =>
  ({ ...list, tiers: list.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

export function removeTier(list: TierList, id: string): TierList {
  const { [id]: _, ...placed } = list.placed; // its items go back to the pool
  return { ...list, tiers: list.tiers.filter((t) => t.id !== id), placed };
}

export function moveTier(list: TierList, id: string, step: -1 | 1): TierList {
  const i = list.tiers.findIndex((t) => t.id === id);
  const j = i + step;
  if (i < 0 || j < 0 || j >= list.tiers.length) return list;
  const tiers = [...list.tiers];
  [tiers[i], tiers[j]] = [tiers[j]!, tiers[i]!];
  return { ...list, tiers };
}

export const clearAll = (list: TierList): TierList => ({ ...list, placed: Object.fromEntries(list.tiers.map((t) => [t.id, []])) });

// Classic lists: every item still in the pool goes to the tier named after its rating tier (where such a tier exists).
export function fillByRating(list: TierList, items: { id: string; rating: number }[]): TierList {
  let next = list;
  for (const item of items) {
    if (tierOfItem(next, item.id) !== POOL) continue;
    const tier = next.tiers.find((t) => t.label.trim().toUpperCase() === tierOf(item.rating));
    if (tier) next = place(next, item.id, tier.id, null);
  }
  return next;
}
