// Arena stats from the Worker (data/arenaWorker.ts), refreshed with every season change (a played match adds to them).
import { useQuery } from "@tanstack/react-query";
import type { ArenaArgs, ArenaRead, ArenaResult } from "../../data/arenaWorker";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY } from "../../data/seasonQuery";

export function useArenaRead<K extends ArenaRead>(kind: K, ...args: ArenaArgs<K>) {
  return useQuery({ queryKey: [...SEASON_QUERY, "arenas", kind, ...args], queryFn: () => engine().arenaRead(kind, args) as Promise<ArenaResult<K>>, enabled: typeof Worker !== "undefined" }).data;
}
