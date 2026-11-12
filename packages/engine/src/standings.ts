// League table from match results (PRD §5.5). Points 3/1/0. Always rebuilt from matches;
// a stored order is never trusted.
export type StandingMatch = { idolA: string; idolB: string; scoreA: number; scoreB: number; result: "A" | "B" | "D" };
export type StandingIdol = { id: string; startRating: number };
export type StandingRow = {
  idolId: string; rank: number; played: number; wins: number; draws: number; losses: number;
  points: number; gamesWon: number; gamesLost: number; gameDiff: number;
};

function tally(ids: string[], matches: StandingMatch[]): Map<string, StandingRow> {
  const rows = new Map(ids.map((idolId) => [idolId, {
    idolId, rank: 0, played: 0, wins: 0, draws: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0, gameDiff: 0,
  }]));
  for (const match of matches) {
    const sides = [[match.idolA, match.scoreA, match.scoreB, "A"], [match.idolB, match.scoreB, match.scoreA, "B"]] as const;
    for (const [id, won, lost, side] of sides) {
      const row = rows.get(id);
      if (!row) throw new Error(`Match has idol ${id} who is not in this table`);
      row.played++;
      row.gamesWon += won;
      row.gamesLost += lost;
      row.gameDiff = row.gamesWon - row.gamesLost;
      if (match.result === "D") { row.draws++; row.points += 1; }
      else if (match.result === side) { row.wins++; row.points += 3; }
      else row.losses++;
    }
  }
  return rows;
}

const byTotals = (a: StandingRow, b: StandingRow) => b.points - a.points || b.gameDiff - a.gameDiff || b.gamesWon - a.gamesWon;

export function computeStandings(idols: StandingIdol[], matches: StandingMatch[]): StandingRow[] {
  const rating = new Map(idols.map((i) => [i.id, i.startRating]));
  const sorted = [...tally([...rating.keys()], matches).values()].sort(byTotals);

  // Idols still level on points, game diff and games won are split by a mini-table of
  // only their matches against each other, then wins, start rating and idol id.
  const table: StandingRow[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i + 1;
    while (j < sorted.length && byTotals(sorted[i], sorted[j]) === 0) j++;
    const group = sorted.slice(i, j);
    const ids = new Set(group.map((r) => r.idolId));
    const h2h = tally([...ids], matches.filter((x) => ids.has(x.idolA) && ids.has(x.idolB)));
    group.sort((a, b) => {
      const ha = h2h.get(a.idolId)!, hb = h2h.get(b.idolId)!;
      return hb.points - ha.points || hb.gameDiff - ha.gameDiff || b.wins - a.wins
        || rating.get(b.idolId)! - rating.get(a.idolId)! || (a.idolId < b.idolId ? -1 : 1);
    });
    table.push(...group);
    i = j;
  }
  table.forEach((row, index) => { row.rank = index + 1; });
  return table;
}
