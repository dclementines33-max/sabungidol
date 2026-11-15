import { describe, expect, it } from "vitest";
import { type BracketMatch, bracketDisplayOrder } from "./bracket";
import { idolsPlayoffTemplate, inkigayoTemplate } from "./doubleElimination";
import { knockoutTemplate } from "./knockout";
import { nuguEntryPlan } from "./nuguPlan";

// Every bracket the app draws (data/bracketSkeleton): Unzure KO, B-Side cups, Nugu, Inkigayo, The Idols playoff.
const FORMATS: [string, BracketMatch[]][] = [
  ["Unzure Cup knockout", knockoutTemplate([32], { thirdPlace: true })],
  ["B-Side Cup", knockoutTemplate([16], { pairing: "seed" })],
  ["Nugu Cup", knockoutTemplate(nuguEntryPlan(120, 120, 9), { pairing: "seed" })],
  ["Inkigayo Cup", inkigayoTemplate()],
  ["The Idols playoff", idolsPlayoffTemplate()],
];

// The tree (TournamentBracketTree) joins cards 2j and 2j+1 of a round to card j of the next round when that round has
// half as many. Lists every card whose winner-feeders in the round before are not exactly that drawn pair.
function wrongJoins(template: BracketMatch[], order: string[]): string[] {
  const byKey = new Map(template.map((m) => [m.key, m]));
  const double = template.some((m) => m.stage === "UB");
  const sections = new Map<string, BracketMatch[][]>();
  for (const key of order) {
    const m = byKey.get(key)!;
    if (["F", "GF", "3RD"].includes(m.round)) continue;
    const rounds = sections.get(double ? m.stage : "KO") ?? [];
    const last = rounds.at(-1);
    if (last && last[0]!.round === m.round) last.push(m); else rounds.push([m]);
    sections.set(double ? m.stage : "KO", rounds);
  }
  const wrong: string[] = [];
  for (const rounds of sections.values()) {
    for (let r = 0; r + 1 < rounds.length; r++) {
      const [cur, next] = [rounds[r]!, rounds[r + 1]!];
      if (next.length * 2 !== cur.length) continue; // not drawn as joins
      next.forEach((m, j) => {
        const feeders = [m.a, m.b].flatMap((s) => ("winner" in s && cur.some((c) => c.key === s.winner) ? [s.winner] : []));
        const drawn = [cur[2 * j]!.key, cur[2 * j + 1]!.key];
        if (feeders.length && !feeders.every((f) => drawn.includes(f))) wrong.push(`${m.key} fed by ${feeders.join(" + ")}, drawn beside ${drawn.join(" + ")}`);
      });
    }
  }
  return wrong;
}

describe("bracket drawing order", () => {
  it.each(FORMATS)("%s: every match's winner feeds the card it is drawn joined to", (_name, template) => {
    const order = bracketDisplayOrder(template);
    expect(new Set(order)).toEqual(new Set(template.map((m) => m.key))); // nothing lost or doubled
    expect(wrongJoins(template, order)).toEqual([]);
  });

  it("the old slot order was the bug: B-Side drew winners into the wrong next match", () => {
    const template = knockoutTemplate([16], { pairing: "seed" });
    expect(wrongJoins(template, template.map((m) => m.key)).length).toBeGreaterThan(0);
  });
});
