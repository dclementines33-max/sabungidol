// Click a match → MatchModal (PRD §9). "Simulate" shows the engine's games for this match; the
// accepted result is saved with its method and the season views refresh.
import { type AcceptedResult, MatchModal } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { useBranding } from "../../data/branding";

export function PlayMatchDialog({ matchId, onClose }: { matchId: string | null; onClose: () => void }) {
  const { label } = useBranding();
  const { data: match } = useQuery({ queryKey: ["match-preview", matchId], queryFn: () => engine().matchPreview(matchId!), enabled: !!matchId, staleTime: 0, gcTime: 0 });
  const { data: h2h } = useQuery({ queryKey: ["match-h2h", match?.idolA, match?.idolB], queryFn: () => engine().headToHead(match!.idolA, match!.idolB), enabled: !!match, staleTime: 0 });
  if (!matchId || !match || match.id !== matchId) return null;
  const line = (l: { wins: number; draws: number; losses: number; titles: number } | null | undefined) => l ? [`${l.wins}-${l.draws}-${l.losses}`, String(l.titles)] : ["–", "–"];
  const [careerA, titlesA] = line(h2h?.lineA);
  const [careerB, titlesB] = line(h2h?.lineB);
  const facts = [
    { label: `Season ini · ${label(match.comp)}`, a: match.record.comp[0]!, b: match.record.comp[1]! },
    { label: "Season ini · semua", a: match.record.all[0]!, b: match.record.all[1]! },
    { label: "Karier M-S-K", a: careerA!, b: careerB! },
    { label: "Gelar", a: titlesA!, b: titlesB! },
  ];

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
      title={`${label(match.comp)} · ${match.round} · Match ${match.slot}`}
      idolA={match.idolA}
      idolB={match.idolB}
      bestOf={match.bestOf}
      h2h={h2h?.pair ? { winsA: h2h.pair.wins, draws: h2h.pair.draws, winsB: h2h.pair.losses } : undefined}
      facts={facts}
      simulate={() => match.games}
      onAccept={accept}
    />
  );
}
