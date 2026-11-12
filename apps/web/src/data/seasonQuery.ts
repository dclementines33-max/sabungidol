// The season shown in the header and season screens, read from the Worker. Uses the app's one
// query client directly so the shell also renders where no provider is set up (its tests).
import { useQuery } from "@tanstack/react-query";
import { engine } from "./engineClient";
import { queryClient } from "./queryClient";

export const SEASON_QUERY = ["season"] as const;

export const useCurrentSeason = () => useQuery({
  queryKey: SEASON_QUERY,
  queryFn: async () => (await engine().currentSeason()) ?? null, // the query cache refuses undefined
  enabled: typeof Worker !== "undefined",
}, queryClient).data;

// The 12 league rosters of a season (D1A … D2F; empty until there is one). The Idols roster, stored
// once the season starts, is left out: screens that say "league" mean these twelve.
export const useLeagueRosters = (seasonId: string | undefined) => useQuery({
  queryKey: [...SEASON_QUERY, "rosters", seasonId],
  queryFn: async () => { const { IDL: _theIdols, ...leagues } = await engine().leagueRosters(seasonId!); return leagues; },
  enabled: !!seasonId,
}, queryClient).data;
