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
