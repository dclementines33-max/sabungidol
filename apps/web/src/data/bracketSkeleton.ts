// The whole shape of a cup's bracket from the start (Update 2: every slot drawn, unknown sides blank):
// the same templates the engine plays, filled with what is already decided.
import { type BracketMatch, bracketDisplayOrder, idolsPlayoffTemplate, inkigayoTemplate, knockoutTemplate, nuguEntryPlan, resolveBracket } from "@sabung/engine";

function template(comp: string, d2: number, d1: number): BracketMatch[] | null {
  if (comp === "IDL") return idolsPlayoffTemplate();
  if (comp === "INK") return inkigayoTemplate();
  if (comp === "UZC") return knockoutTemplate([32], { thirdPlace: true });
  if (comp === "NUG") return knockoutTemplate(nuguEntryPlan(d2, d1, 9), { pairing: "seed" });
  if (comp.startsWith("BS")) return knockoutTemplate([16], { pairing: "seed" });
  return null;
}

type Known = { comp: string; stage: string; round: string; slot: number; winner?: string; score?: string };

// Slots of `comp` not in `known` yet, with the sides an earlier result already decides ("" = blank),
// (seeds known before they play are filled in), and every slot key in bracket order (each round ordered by bracketDisplayOrder).
export function bracketSkeleton(comp: string, known: Known[], d2: number, d1: number, entrants: string[] = []) {
  const t = template(comp, d2, d1);
  if (!t) return { blank: [], order: [] };
  const mine = known.filter((c) => c.comp === comp);
  const keys = new Set(mine.map((c) => `${c.stage}-${c.round}-${c.slot}`));
  const played = new Map(mine.filter((c) => c.winner).map((c) => [`${c.stage}-${c.round}-${c.slot}`, { winner: c.winner!, score: c.score }]));
  const blank = resolveBracket(t, entrants, played).filter((c) => !keys.has(c.key))
    .map((c) => ({ key: `${comp}-${c.key}`, id: "", comp, stage: c.stage, round: c.round, slot: c.slot, a: c.a ?? "", b: c.b ?? "" }));
  return { blank, order: bracketDisplayOrder(t).map((key) => `${comp}-${key}`) }; // drawn so neighbours feed the card they join
}
