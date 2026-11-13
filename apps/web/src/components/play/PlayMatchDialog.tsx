// Click a match → MatchModal (PRD §9). "Simulate" shows the engine's games for this match; the
// accepted result is saved with its method and the season views refresh.
import { type AcceptedResult, MatchModal } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { titleLabel } from "./competitionLinks";

export function PlayMatchDialog({ matchId, onClose }: { matchId: string | null; onClose: () => void }) {
  const { data: match } = useQuery({ queryKey: ["match-preview", matchId], queryFn: () => engine().matchPreview(matchId!), enabled: !!matchId, staleTime: 0, gcTime: 0 });
  if (!matchId || !match || match.id !== matchId) return null;

  const accept = async ({ method, games }: AcceptedResult) => {
    try {
      const r = await engine().acceptMatch(match.id, games, method);
      notify({ level: "success", message: `Hasil disimpan: ${r.scoreA}–${r.scoreB}` });
    } catch (error) {
      notify({ level: "error", code: "E-PLAY-002", message: "Hasil match tidak tersimpan.", context: error instanceof Error ? error.message : String(error) });
    } finally {
      await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
    }
  };

  return (
    <MatchModal
      key={match.id}
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={`${titleLabel(match.comp)} · ${match.round} · Match ${match.slot}`}
      idolA={match.idolA}
      idolB={match.idolB}
      bestOf={match.bestOf}
      simulate={() => match.games}
      onAccept={accept}
    />
  );
}
