// Final places of one finished season (PRD §7.2): one row per idol per competition, by title key
// (D1A … D2F, IDL league, IDL-PO, UZC, INK, NUG, BSA … BSF, DSG, MBK-D1A …). Swiss and LCQ are the road
// into Unzure and get no row of their own. Ties share a place (competition ranking: 1, 2, T3, T3, 5).
import { computeStandings } from "../standings";
import type { SimMatch, Title } from "./types";

export type Placement = { comp: string; idolId: string; finalRank: number; tied: number; stageReached: string; leaguePoints?: number };

// Knockout or double elimination: 1 and 2 from the title, a 3RD match gives 3 and 4, everyone else is
// ranked by the round of their last match (later = better).
function bracket(comp: string, matches: SimMatch[], title: Title): Placement[] {
  const out: Placement[] = [
    { comp, idolId: title.champion, finalRank: 1, tied: 1, stageReached: "W" },
    { comp, idolId: title.runnerUp, finalRank: 2, tied: 1, stageReached: "F" },
  ];
  const placed = new Set([title.champion, title.runnerUp]);
  let next = 3;
  const third = matches.find((m) => m.round === "3RD");
  if (third) {
    const [w, l] = third.result === "A" ? [third.idolA, third.idolB] : [third.idolB, third.idolA];
    out.push({ comp, idolId: w, finalRank: 3, tied: 1, stageReached: "3RD" }, { comp, idolId: l, finalRank: 4, tied: 1, stageReached: "3RD" });
    placed.add(w).add(l);
    next = 5;
  }
  const last = new Map<string, string>();
  for (const m of matches) last.set(m.idolA, m.round).set(m.idolB, m.round);
  const byRound = new Map<string, string[]>();
  for (const [idol, round] of last) if (!placed.has(idol)) byRound.set(round, [...(byRound.get(round) ?? []), idol]);
  for (const round of [...new Set(matches.map((m) => m.round))].reverse()) {
    const idols = byRound.get(round) ?? [];
    for (const idolId of idols) out.push({ comp, idolId, finalRank: next, tied: idols.length, stageReached: round });
    next += idols.length;
  }
  return out;
}

export function seasonPlacements(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>, rating: (id: string) => number): Placement[] {
  const out: Placement[] = [];
  for (const [comp, roster] of Object.entries(leagues)) {
    const table = computeStandings(roster.map((id) => ({ id, startRating: rating(id) })), matches.filter((m) => m.comp === comp && m.stage === "LG"));
    for (const row of table) out.push({ comp, idolId: row.idolId, finalRank: row.rank, tied: 1, stageReached: "LG", leaguePoints: row.points });
  }
  const brackets = new Map<string, SimMatch[]>();
  for (const m of matches) {
    if (m.stage === "LG" || m.comp === "SWS" || m.comp === "LCQ" || m.stage === "GS") continue;
    if (m.comp === "DSG" || m.comp === "MBK") { // one match each (Music Bank: one per D1 league, round = league code)
      const key = m.comp === "DSG" ? "DSG" : `MBK-${m.round}`;
      const [w, l] = m.result === "A" ? [m.idolA, m.idolB] : [m.idolB, m.idolA];
      out.push({ comp: key, idolId: w, finalRank: 1, tied: 1, stageReached: "W" }, { comp: key, idolId: l, finalRank: 2, tied: 1, stageReached: "F" });
      continue;
    }
    const key = m.comp === "IDL" ? "IDL-PO" : m.comp;
    brackets.set(key, [...(brackets.get(key) ?? []), m]);
  }
  for (const [key, list] of brackets) { const title = titles[key]; if (title) out.push(...bracket(key, list, title)); }
  const ko = new Set(out.filter((p) => p.comp === "UZC").map((p) => p.idolId));
  const groupExits = [...new Set(matches.filter((m) => m.comp === "UZC" && m.stage === "GS").flatMap((m) => [m.idolA, m.idolB]))].filter((id) => !ko.has(id));
  for (const idolId of groupExits) out.push({ comp: "UZC", idolId, finalRank: ko.size + 1, tied: groupExits.length, stageReached: "GS" });
  return out;
}
