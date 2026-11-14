// Small pieces every Settings section uses: the input look, the section frame, refreshing the season.
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";

export const FIELD = "mt-1 block w-full rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright";
export const SECTION = "studio-section before:hidden space-y-4"; // R4 chapter, no box; no number (user 2026-11-15)
export const refreshSeason = () => queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
