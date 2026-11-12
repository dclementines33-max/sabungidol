// Rating tier (PRD §3): S ≥ 90, A 80–89, B 70–79, C 60–69, D < 60.
export type Tier = "S" | "A" | "B" | "C" | "D";

export function tierOf(rating: number): Tier {
  return rating >= 90 ? "S" : rating >= 80 ? "A" : rating >= 70 ? "B" : rating >= 60 ? "C" : "D";
}
