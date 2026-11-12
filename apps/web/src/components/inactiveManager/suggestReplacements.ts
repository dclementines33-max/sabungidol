// Inactive Manager (PRD §8): idols leaving that hold a league place get a replacement suggestion —
// the best-rated active idol without a place (a reserve), each reserve used once.
type Idol = { id: string; rating: number; name: string; active: boolean };

export function suggestReplacements(leaving: string[], rosters: Record<string, string[]>, idols: Idol[]) {
  const placeOf = new Map(Object.entries(rosters).flatMap(([comp, ids]) => ids.map((id) => [id, comp] as const)));
  const going = new Set(leaving);
  const reserves = idols.filter((i) => i.active && !placeOf.has(i.id) && !going.has(i.id))
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).map((i) => i.id);
  return leaving.filter((id) => placeOf.has(id)).map((id) => ({ id, comp: placeOf.get(id)!, suggestion: reserves.shift() ?? null }));
}
