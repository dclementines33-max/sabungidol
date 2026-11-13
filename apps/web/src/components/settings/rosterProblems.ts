// Every roster problem across the 12 leagues at once (shown outside the roster popup, so nobody has to
// open each league to find one): wrong size, the same idol twice, an idol in two leagues, an inactive idol.
import { D1_LEAGUES, D2_LEAGUES, LEAGUE_SIZE } from "@sabung/shared";

export type RosterProblem = { league: string; text: string };

export function rosterProblems(rosters: Record<string, string[]>, activeIds: string[], name: (id: string) => string): RosterProblem[] {
  const active = new Set(activeIds);
  const leaguesOf = new Map<string, string[]>();
  for (const [league, ids] of Object.entries(rosters)) for (const id of new Set(ids)) leaguesOf.set(id, [...(leaguesOf.get(id) ?? []), league]);
  return [...D1_LEAGUES, ...D2_LEAGUES].flatMap((league) => {
    const ids = rosters[league] ?? [];
    const out: RosterProblem[] = [];
    if (ids.length !== LEAGUE_SIZE) out.push({ league, text: `${ids.length}/${LEAGUE_SIZE} idol (${ids.length > LEAGUE_SIZE ? "kelebihan" : "kurang"} ${Math.abs(ids.length - LEAGUE_SIZE)})` });
    const twice = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    if (twice.length) out.push({ league, text: `Ganda: ${twice.map(name).join(", ")}` });
    const shared = [...new Set(ids)].filter((id) => leaguesOf.get(id)!.length > 1);
    if (shared.length) out.push({ league, text: `Juga di liga lain: ${shared.map((id) => `${name(id)} (${leaguesOf.get(id)!.filter((l) => l !== league).join(", ")})`).join(", ")}` });
    const inactive = ids.filter((id) => !active.has(id));
    if (inactive.length) out.push({ league, text: `Tidak aktif: ${inactive.map(name).join(", ")}` });
    return out;
  });
}
