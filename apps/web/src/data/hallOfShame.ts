// Hall of Shame (2026-11-18): the all-time records nobody wants, top five per category. Pure: built in the Worker from the
// cached career rows, head-to-head pairs, the 100 biggest upsets and the idols' current ratings.
import type { CareerRow, PairRecord, Upset } from "@sabung/engine";

export type ShameEntry = { ids: string[]; value: string };
export type ShameCategory = { id: string; title: string; quip: string; entries: ShameEntry[] };

const TOP = 5;
const s = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function hallOfShame(rows: CareerRow[], pairs: Record<string, PairRecord>, upsets: Upset[], ratings: Map<string, number>, minMatches = 20): ShameCategory[] {
  const all = rows.filter((r) => r.comp === "ALL" && r.matches > 0);
  const top = (list: CareerRow[], score: (r: CareerRow) => number, value: (r: CareerRow) => string, asc = false): ShameEntry[] =>
    list.filter((r) => score(r) > 0 || asc)
      .sort((x, y) => (asc ? score(x) - score(y) : score(y) - score(x)) || y.matches - x.matches || x.idolId.localeCompare(y.idolId))
      .slice(0, TOP).map((r) => ({ ids: [r.idolId], value: value(r) }));
  const sampled = all.filter((r) => r.matches >= minMatches);
  const crownless = sampled.filter((r) => r.titles === 0);

  const victims = new Map<string, number>();
  for (const u of upsets) victims.set(u.loser, (victims.get(u.loser) ?? 0) + 1);
  const cursed = Object.entries(pairs).flatMap(([key, p]) => {
    const [lo, hi] = key.split("|") as [string, string];
    if (p.draws > 0 || (p.winsLo > 0 && p.winsHi > 0)) return [];
    const [loser, winner, n] = p.winsLo === 0 ? [lo, hi, p.winsHi] : [hi, lo, p.winsLo];
    return n >= 3 ? [{ loser, winner, n }] : [];
  }).sort((x, y) => y.n - x.n || x.loser.localeCompare(y.loser)).slice(0, TOP);

  return [
    { id: "losses", title: "Most losses", quip: "Showed up. Lost. Showed up again.", entries: top(all, (r) => r.losses, (r) => `${r.losses} loss${r.losses === 1 ? "" : "es"}`) },
    { id: "skid", title: "Longest losing streak", quip: "The skid nobody could stop.", entries: top(all, (r) => r.bestLoseStreak, (r) => `${r.bestLoseStreak} defeats in a row`) },
    { id: "rate", title: "Worst win rate", quip: `The safest opponent in the draw (min. ${minMatches} matches).`, entries: top(sampled, (r) => r.winRate, (r) => `${(r.winRate * 100).toFixed(1)}%`, true) },
    { id: "bridesmaid", title: "Always the bridesmaid", quip: "Runner-up again and again, never the crown.", entries: top(all.filter((r) => r.titles === 0), (r) => r.runnerUp, (r) => s(r.runnerUp, "runner-up finish")) },
    { id: "silver", title: "Silver collector", quip: "Most finals lost, titles or not.", entries: top(all, (r) => r.runnerUp, (r) => s(r.runnerUp, "final") + " lost") },
    { id: "paper", title: "Paper tiger", quip: "Rated like a champion. Trophy cabinet: empty.", entries: top(crownless, (r) => ratings.get(r.idolId) ?? 0, (r) => `rated ${ratings.get(r.idolId) ?? "?"} · 0 titles`) },
    { id: "waiting", title: "Still waiting", quip: "So many matches, not one trophy.", entries: top(crownless, (r) => r.matches, (r) => `${r.matches} matches, 0 titles`) },
    { id: "fall", title: "Biggest fall", quip: "The bigger they are…", entries: upsets.slice(0, TOP).map((u) => ({ ids: [u.loser, u.winner], value: `beaten by a ${u.gap}-point underdog · S${u.season}` })) },
    { id: "magnet", title: "Upset magnet", quip: "Underdogs circle this name in red.", entries: [...victims].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, TOP).map(([id, n]) => ({ ids: [id], value: `${s(n, "big upset")} suffered` })) },
    { id: "cursed", title: "Cursed matchup", quip: "Never won, never drew. Not once.", entries: cursed.map((c) => ({ ids: [c.loser, c.winner], value: `0–${c.n} against` })) },
    { id: "groups", title: "Group-stage regular", quip: "Knows the group stage by heart. Only the group stage.", entries: top(all, (r) => r.groupExit, (r) => s(r.groupExit, "group exit")) },
  ].filter((c) => c.entries.length > 0);
}
