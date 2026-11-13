// Girl Group Stats (PRD §8): per group — active members, total titles, combined win rate, best member
// (most titles, then rating), average rating. Soloists are not a group and are left out.
import type { IdolRow } from "@sabung/db";
import type { CareerRow } from "@sabung/engine";

export type GroupStat = { id: string; name: string; members: string[]; active: number; titles: number; winRate: number; best: string; avgRating: number };

export function groupStats(idols: IdolRow[], combined: CareerRow[]): GroupStat[] {
  const career = new Map(combined.map((r) => [r.idolId, r]));
  const groups = new Map<string, IdolRow[]>();
  for (const i of idols) if (i.groupId) groups.set(i.groupId, [...(groups.get(i.groupId) ?? []), i]);
  return [...groups].map(([id, members]) => {
    const lines = members.map((m) => career.get(m.id));
    const matches = lines.reduce((n, l) => n + (l?.matches ?? 0), 0);
    const score = lines.reduce((n, l) => n + (l ? l.wins + 0.5 * l.draws : 0), 0);
    const best = [...members].sort((a, b) => (career.get(b.id)?.titles ?? 0) - (career.get(a.id)?.titles ?? 0) || b.rating - a.rating || a.name.localeCompare(b.name))[0]!;
    return {
      id, name: members[0]!.groupName ?? id, members: members.map((m) => m.id),
      active: members.filter((m) => m.active).length,
      titles: lines.reduce((n, l) => n + (l?.titles ?? 0), 0),
      winRate: matches ? score / matches : 0,
      best: best.id,
      avgRating: members.reduce((n, m) => n + m.rating, 0) / members.length,
    };
  }).sort((a, b) => b.titles - a.titles || b.winRate - a.winRate || a.name.localeCompare(b.name));
}
