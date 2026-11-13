// Small pieces every Settings section uses: the input look, the section frame, refreshing the season.
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";

export const FIELD = "mt-1 block w-full rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright";
export const SECTION = "studio-section space-y-4"; // R4: numbered chapter, no box
export const refreshSeason = () => queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
