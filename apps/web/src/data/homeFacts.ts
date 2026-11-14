// Home's all-time numbers (Update 2): leaders per category and a pool of facts to pick from at random.
// Pure: built from the cached career rows, head-to-head pairs and upsets.
import { type CareerRow, type PairRecord, type Upset, careerOrder } from "@sabung/engine";

export type Leader = { label: string; idolId: string; value: string };
export type Fact = { label: string; ids: string[]; value: string };

const MIN_MATCHES = 20; // highest win rate needs a real sample

function best(rows: CareerRow[], score: (r: CareerRow) => number) {
  return rows.reduce<CareerRow | undefined>((top, r) => (score(r) > 0 && (!top || score(r) > score(top)) ? r : top), undefined);
}

// Home's top slot: #1 of Career Stats "Semua" in its default order (titles).
export const allTimeTop = (rows: CareerRow[]): CareerRow | null =>
  rows.filter((r) => r.comp === "ALL" && r.matches > 0).sort(careerOrder("titles"))[0] ?? null;

export function homeLeaders(rows: CareerRow[]): Leader[] {
  const all = rows.filter((r) => r.comp === "ALL");
  const comp = (key: string) => rows.filter((r) => r.comp === key);
  const league = new Map<string, number>();
  for (const r of rows) if (r.comp === "D1" || r.comp === "D2") league.set(r.idolId, (league.get(r.idolId) ?? 0) + r.titles);
  const topLeague = [...league].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const pick = (label: string, row: CareerRow | undefined, value: (r: CareerRow) => string): Leader[] => (row ? [{ label, idolId: row.idolId, value: value(row) }] : []);
  return [
    ...pick("Gelar terbanyak (semua)", best(all, (r) => r.titles), (r) => `${r.titles} gelar`),
    ...pick("Gelar Unzure Cup", best(comp("UZC"), (r) => r.titles), (r) => `${r.titles} gelar`),
    ...(topLeague && topLeague[1] > 0 ? [{ label: "Gelar liga", idolId: topLeague[0], value: `${topLeague[1]} gelar` }] : []),
    ...pick("Gelar The Idols", best(comp("IDL"), (r) => r.titles), (r) => `${r.titles} gelar`),
    ...pick("Match terbanyak", best(all, (r) => r.matches), (r) => `${r.matches} match`),
    ...pick("Menang terbanyak", best(all, (r) => r.wins), (r) => `${r.wins} menang`),
    ...pick("Kalah terbanyak", best(all, (r) => r.losses), (r) => `${r.losses} kalah`),
    ...pick("Win rate tertinggi", best(all.filter((r) => r.matches >= MIN_MATCHES), (r) => r.winRate), (r) => `${(r.winRate * 100).toFixed(1)}%`),
  ];
}

export function homeFacts(rows: CareerRow[], pairs: Record<string, PairRecord>, upsets: Upset[]): Fact[] {
  const all = rows.filter((r) => r.comp === "ALL");
  const facts: Fact[] = [];
  const rivalry = Object.entries(pairs).sort((x, y) => y[1].meetings - x[1].meetings || x[0].localeCompare(y[0]))[0];
  if (rivalry) facts.push({ label: "Rivalitas paling sering bertemu", ids: rivalry[0].split("|"), value: `${rivalry[1].meetings} kali bertemu · ${rivalry[1].winsLo}–${rivalry[1].draws}–${rivalry[1].winsHi}` });
  const upset = [...upsets].sort((a, b) => b.gap - a.gap)[0];
  if (upset) facts.push({ label: "Kejutan terbesar sepanjang masa", ids: [upset.winner, upset.loser], value: `menang meski rating ${upset.gap} lebih rendah (Season ${upset.season})` });
  const add = (label: string, row: CareerRow | undefined, value: (r: CareerRow) => string) => { if (row) facts.push({ label, ids: [row.idolId], value: value(row) }); };
  add("Rekor menang beruntun", best(all, (r) => r.bestWinStreak), (r) => `${r.bestWinStreak} kemenangan beruntun`);
  add("Rekor tak terkalahkan", best(all, (r) => r.bestUnbeatenStreak), (r) => `${r.bestUnbeatenStreak} match tanpa kalah`);
  add("Raja reverse sweep", best(all, (r) => r.reverseSweeps), (r) => `${r.reverseSweeps}× menang setelah tertinggal jauh`);
  add("Pembunuh raksasa", best(all, (r) => r.giantKills), (r) => `${r.giantKills}× mengalahkan idol berating 15+ lebih tinggi`);
  add("Langganan final", best(all, (r) => r.finals), (r) => `${r.finals} final dimainkan`);
  return facts;
}
