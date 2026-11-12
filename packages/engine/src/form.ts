// Form from the last 5 matches across all competitions (PRD §5.2). Win = 1, draw = 0.5.
export type Result = "W" | "D" | "L";
export type Form = { name: "On Fire" | "Hot Streak" | "Confident" | "Steady" | "Cold Slump"; modifier: number };

export function getForm(results: Result[]): Form {
  const last5 = results.slice(-5);
  if (last5.length < 5) return { name: "Steady", modifier: 0 }; // too few matches yet (user decision 2026-11-12)
  const score = last5.reduce((sum, r) => sum + (r === "W" ? 1 : r === "D" ? 0.5 : 0), 0);
  if (score === 5) return { name: "On Fire", modifier: 3 };
  if (score >= 4) return { name: "Hot Streak", modifier: 2 };
  if (score >= 3) return { name: "Confident", modifier: 1 };
  if (score >= 2) return { name: "Steady", modifier: 0 };
  return { name: "Cold Slump", modifier: -2 };
}
