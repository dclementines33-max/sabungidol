// Rivalry label (PRD §16): a name for a pair from A's side, once they have met often enough to mean something.
export function rivalryLabel(wins: number, draws: number, losses: number): string | null {
  const meetings = wins + draws + losses;
  if (meetings < 4) return null;
  const share = (wins + draws / 2) / meetings;
  if (share >= 0.75) return "Mangsa favorit"; // A nearly always beats B
  if (share <= 0.25) return "Momok"; // B nearly always beats A
  if (meetings >= 8 && Math.abs(share - 0.5) <= 0.1) return "Rivalitas abadi";
  return meetings >= 8 ? "Rival lama" : null;
}
