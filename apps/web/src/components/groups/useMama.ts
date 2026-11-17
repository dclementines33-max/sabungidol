// The seasons each girl group won MAMA (the best-group season award), from the award history.
import { useQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";

export function useMama(): (groupId: string) => number[] {
  const { data = [] } = useQuery({ queryKey: ["award-history"], queryFn: () => engine().awardHistory(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  return (groupId) => data.filter((a) => a.key === "mama" && a.id === groupId).map((a) => a.season);
}
