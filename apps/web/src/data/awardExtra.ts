// What the season awards need besides the matches: each idol's group (MAMA) and this season's badges (Golden Disk ties).
export function awardExtra(idols: { id: string; groupId: string | null }[], badges: { idolId: string }[]) {
  const count = new Map<string, number>();
  for (const b of badges) count.set(b.idolId, (count.get(b.idolId) ?? 0) + 1);
  return { groups: new Map(idols.map((i) => [i.id, i.groupId])), badges: count };
}
