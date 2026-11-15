// What one idol did in one season, from that season's matches: the record, and which stories name her.
type Played = { idolA: string; idolB: string; result: "A" | "B" | "D" };
type Named = Record<string, unknown>;

export function seasonRecord(matches: Played[], id: string) {
  let wins = 0, draws = 0, losses = 0;
  for (const m of matches) {
    if (m.idolA !== id && m.idolB !== id) continue;
    if (m.result === "D") draws++;
    else if ((m.result === "A") === (m.idolA === id)) wins++;
    else losses++;
  }
  const total = wins + draws + losses;
  return { wins, draws, losses, winRate: total ? (wins + draws / 2) / total : 0 };
}

// Stories name idols in different fields (winner, loser, idol, a, b).
export const involves = (story: Named, id: string) => ["winner", "loser", "idol", "a", "b"].some((k) => story[k] === id);
