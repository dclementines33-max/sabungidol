// Girl Group Stats (PRD §8; Update 2 ref "3 girl group stats"): per group — members (ranked by titles, then win rate),
// active members, total titles and titles per competition, matches, W/D/L, win rate, game difference, best member,
// average rating. Soloists are not a group and are left out.
import type { IdolRow } from "@sabung/db";
import type { CareerRow } from "@sabung/engine";
import { tierOf } from "@sabung/shared";

export type TitleLine = { idolId: string; comp: string; titles: number };
export type GroupStat = {
  id: string; name: string; members: string[]; active: number; titles: number; byComp: Record<string, number>;
  matches: number; wins: number; draws: number; losses: number; winRate: number; gameDiff: number; best: string; avgRating: number;
  tiers: Record<string, number>; // members per rating tier
};

export function groupStats(idols: IdolRow[], combined: CareerRow[], titles: TitleLine[] = []): GroupStat[] {
  const career = new Map(combined.map((r) => [r.idolId, r]));
  const groups = new Map<string, IdolRow[]>();
  for (const i of idols) if (i.groupId) groups.set(i.groupId, [...(groups.get(i.groupId) ?? []), i]);
  const sum = (lines: (CareerRow | undefined)[], key: "matches" | "wins" | "draws" | "losses" | "titles" | "gameDiff") => lines.reduce((n, l) => n + (l?.[key] ?? 0), 0);
  return [...groups].map(([id, members]) => {
    const ranked = [...members].sort((a, b) => (career.get(b.id)?.titles ?? 0) - (career.get(a.id)?.titles ?? 0)
      || (career.get(b.id)?.winRate ?? 0) - (career.get(a.id)?.winRate ?? 0) || b.rating - a.rating || a.name.localeCompare(b.name));
    const lines = members.map((m) => career.get(m.id));
    const matches = sum(lines, "matches");
    const byComp: Record<string, number> = {};
    for (const t of titles) if (members.some((m) => m.id === t.idolId)) byComp[t.comp] = (byComp[t.comp] ?? 0) + t.titles;
    return {
      id, name: members[0]!.groupName ?? id, members: ranked.map((m) => m.id),
      active: members.filter((m) => m.active).length,
      titles: sum(lines, "titles"), byComp,
      matches, wins: sum(lines, "wins"), draws: sum(lines, "draws"), losses: sum(lines, "losses"),
      winRate: matches ? (sum(lines, "wins") + 0.5 * sum(lines, "draws")) / matches : 0,
      gameDiff: sum(lines, "gameDiff"),
      best: ranked[0]!.id,
      avgRating: members.reduce((n, m) => n + m.rating, 0) / members.length,
      tiers: members.reduce<Record<string, number>>((t, m) => ({ ...t, [tierOf(m.rating)]: (t[tierOf(m.rating)] ?? 0) + 1 }), {}),
    };
  }).sort((a, b) => b.titles - a.titles || b.winRate - a.winRate || a.name.localeCompare(b.name));
}
