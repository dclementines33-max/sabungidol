// Double-elimination templates (PRD §4). Grand Final is Bo7 with no bracket reset.
import type { BracketMatch, Source } from "./bracket";

const s = (seed: number): Source => ({ seed });
const w = (key: string): Source => ({ winner: key });
const l = (key: string): Source => ({ loser: key });
const m = (key: string, a: Source, b: Source): BracketMatch => {
  const [stage, round, slot] = key.split("-");
  return { key, stage: stage as BracketMatch["stage"], round, slot: Number(slot), a, b };
};

// The Idols playoff, top 10 of the league: 7 upper + 8 lower + Grand Final = 16 matches.
// Lower rounds 2 and 3 cross sides so a loser does not meet the same half straight away.
export function idolsPlayoffTemplate(): BracketMatch[] {
  return [
    m("UB-R1-1", s(5), s(8)), m("UB-R1-2", s(6), s(7)),
    m("UB-QF-1", s(4), w("UB-R1-1")), m("UB-QF-2", s(3), w("UB-R1-2")),
    m("LB-LB1-1", s(9), s(10)), m("LB-LB1-2", l("UB-R1-1"), l("UB-R1-2")),
    m("LB-LB2-1", w("LB-LB1-1"), l("UB-QF-2")), m("LB-LB2-2", w("LB-LB1-2"), l("UB-QF-1")),
    m("UB-SF-1", s(1), w("UB-QF-1")), m("UB-SF-2", s(2), w("UB-QF-2")),
    m("LB-LB3-1", w("LB-LB2-1"), l("UB-SF-1")), m("LB-LB3-2", w("LB-LB2-2"), l("UB-SF-2")),
    m("UB-UF-1", w("UB-SF-1"), w("UB-SF-2")),
    m("LB-LB4-1", w("LB-LB3-1"), w("LB-LB3-2")),
    m("LB-LF-1", w("LB-LB4-1"), l("UB-UF-1")),
    m("FN-GF-1", w("UB-UF-1"), w("LB-LF-1")),
  ];
}

// Inkigayo Cup, 6 league champions by league points; seeds 1–2 skip round 1. 8 matches.
export function inkigayoTemplate(): BracketMatch[] {
  return [
    m("UB-R1-1", s(3), s(6)), m("UB-R1-2", s(4), s(5)), // losers go home
    m("UB-SF-1", s(1), w("UB-R1-2")), m("UB-SF-2", s(2), w("UB-R1-1")),
    m("LB-SF-1", l("UB-SF-1"), l("UB-SF-2")),
    m("UB-UF-1", w("UB-SF-1"), w("UB-SF-2")),
    m("LB-LF-1", w("LB-SF-1"), l("UB-UF-1")),
    m("FN-GF-1", w("UB-UF-1"), w("LB-LF-1")),
  ];
}
