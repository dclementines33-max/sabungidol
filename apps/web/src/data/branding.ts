// The current season's Settings → Branding, read once and shared by every screen that names a competition.
import { useQuery } from "@tanstack/react-query";
import { brandOf, labelOf } from "../components/play/competitionLinks";
import { engine } from "./engineClient";
import { queryClient } from "./queryClient";
import { SEASON_QUERY, useCurrentSeason } from "./seasonQuery";

export function useBranding() {
  const season = useCurrentSeason();
  const { data = [] } = useQuery({
    queryKey: [...SEASON_QUERY, "competitions", season?.id],
    queryFn: () => engine().listCompetitions(season!.id),
    enabled: !!season,
  }, queryClient);
  return { brand: (code: string) => brandOf(data, code), label: (key: string) => labelOf(data, key) };
}
