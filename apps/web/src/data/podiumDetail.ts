// What one idol did in one season, from that season's matches (in play order): the record, games, longest win run,
// and which stories name her.
type Played = { idolA: string; idolB: string; result: "A" | "B" | "D"; scoreA: number; scoreB: number };
type Named = Record<string, unknown>;

export function seasonRecord(matches: Played[], id: string) {
  let wins = 0, draws = 0, losses = 0, gamesWon = 0, gamesLost = 0, run = 0, bestStreak = 0;
  for (const m of matches) {
    if (m.idolA !== id && m.idolB !== id) continue;
    const a = m.idolA === id;
    gamesWon += a ? m.scoreA : m.scoreB;
    gamesLost += a ? m.scoreB : m.scoreA;
    const won = m.result !== "D" && (m.result === "A") === a;
    if (m.result === "D") draws++;
    else if (won) wins++;
    else losses++;
    run = won ? run + 1 : 0;
    bestStreak = Math.max(bestStreak, run);
  }
  const total = wins + draws + losses;
  return { wins, draws, losses, winRate: total ? (wins + draws / 2) / total : 0, gamesWon, gamesLost, bestStreak };
}

// Stories name idols in different fields (winner, loser, idol, a, b).
export const involves = (story: Named, id: string) => ["winner", "loser", "idol", "a", "b"].some((k) => story[k] === id);
