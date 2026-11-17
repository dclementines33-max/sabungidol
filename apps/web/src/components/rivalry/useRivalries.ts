// Every official rivalry (engine officialRivalries, via the head-to-head read), and a lookup by pair for match rows.
import { type Rivalry, pairKey } from "@sabung/engine";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { engine } from "../../data/engineClient";

export function useRivalries(): { list: Rivalry[]; of: (a: string, b: string) => Rivalry | undefined } {
  const { data } = useQuery({ queryKey: ["rivalries"], queryFn: async () => (await engine().headToHead()).rivalries, staleTime: 30_000, enabled: typeof Worker !== "undefined" });
  return useMemo(() => {
    const list = data ?? [];
    const byPair = new Map(list.map((r) => [pairKey(r.a, r.b), r]));
    return { list, of: (a, b) => byPair.get(pairKey(a, b)) };
  }, [data]);
}
