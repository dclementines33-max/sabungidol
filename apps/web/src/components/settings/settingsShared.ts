// Small pieces every Settings section uses: the input look, the section frame, refreshing the season.
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";

export const FIELD = "mt-1 block w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright";
export const SECTION = "space-y-4 rounded-card border border-border bg-bg-raised p-4 md:p-6";
export const refreshSeason = () => queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
