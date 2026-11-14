// Rating tier (user 2026-11-15, replaces PRD §3's S–D): S+ 96–100, S 90–95, A 83–89, B 75–82, C 65–74, D 55–64, F 0–54.
// Lower bounds only, so a decimal rating falls in the band it reaches. The one place that maps rating → tier.
export const TIERS = [
  { tier: "S+", min: 96, range: "96–100" },
  { tier: "S", min: 90, range: "90–95" },
  { tier: "A", min: 83, range: "83–89" },
  { tier: "B", min: 75, range: "75–82" },
  { tier: "C", min: 65, range: "65–74" },
  { tier: "D", min: 55, range: "55–64" },
  { tier: "F", min: 0, range: "0–54" },
] as const;
export type Tier = (typeof TIERS)[number]["tier"];

export function tierOf(rating: number): Tier {
  return (TIERS.find((t) => rating >= t.min) ?? TIERS[TIERS.length - 1]).tier;
}
