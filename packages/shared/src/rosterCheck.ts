// League roster rules (PRD §9 LeagueRosterModal, §14.3): exactly 20, no duplicates,
// and a warning for idols who are also in another league.
export const LEAGUE_SIZE = 20;

export type RosterCheck = {
  count: number;
  duplicates: string[];
  elsewhere: { idolId: string; league: string }[];
  ok: boolean; // may be applied: exactly 20 and no duplicates (elsewhere is a warning only)
};

export function checkRoster(roster: string[], league: string, leagueOf: (idolId: string) => string | null): RosterCheck {
  const duplicates = [...new Set(roster.filter((id, i) => roster.indexOf(id) !== i))];
  const elsewhere = [...new Set(roster)].flatMap((idolId) => {
    const other = leagueOf(idolId);
    return other && other !== league ? [{ idolId, league: other }] : [];
  });
  return { count: roster.length, duplicates, elsewhere, ok: roster.length === LEAGUE_SIZE && duplicates.length === 0 };
}
