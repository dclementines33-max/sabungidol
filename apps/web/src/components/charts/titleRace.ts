// Title race (Update 2): each idol's points after every matchday, from a league's fixtures (3 a win, 1 a draw).
type Fixture = { idolA: string; idolB: string; scoreA?: number; scoreB?: number };

export function pointsByMatchday(fixtures: { round: string; matches: Fixture[] }[], ids: string[]): Record<string, number[]> {
  const total = new Map(ids.map((id) => [id, 0]));
  const out: Record<string, number[]> = Object.fromEntries(ids.map((id) => [id, [0]]));
  for (const { matches } of fixtures) {
    const played = matches.filter((m) => m.scoreA !== undefined);
    if (played.length === 0) break; // the race stops at the first matchday nobody has played
    for (const m of played) {
      const [a, b] = m.scoreA! > m.scoreB! ? [3, 0] : m.scoreA! < m.scoreB! ? [0, 3] : [1, 1];
      if (total.has(m.idolA)) total.set(m.idolA, total.get(m.idolA)! + a);
      if (total.has(m.idolB)) total.set(m.idolB, total.get(m.idolB)! + b);
    }
    for (const id of ids) out[id]!.push(total.get(id)!);
  }
  return out;
}
