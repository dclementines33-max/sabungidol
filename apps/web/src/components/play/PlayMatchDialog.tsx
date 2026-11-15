// Click a match → MatchModal (PRD §9). "Simulate" plays the match when pressed (a new roll each time); the
// accepted result is saved with its method and the season views refresh.
import { type AcceptedResult, MatchModal } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { useBranding } from "../../data/branding";
import { useCelebration } from "./celebrationStore";

// Each competition's own colour on the match stage (Update 3); a league or B-Side cup uses its league's branding colour.
const ACCENT: Record<string, string> = { UZC: "brand-violet", SWS: "brand-indigo", LCQ: "brand-indigo", IDL: "brand-gold", INK: "brand-rose", NUG: "brand-lime", DSG: "brand-gold", MBK: "brand-orchid", D2: "brand-sky", BS: "brand-teal" };

export function PlayMatchDialog({ matchId, onClose }: { matchId: string | null; onClose: () => void }) {
  const { label, brand } = useBranding();
  const { data: match } = useQuery({ queryKey: ["match-preview", matchId], queryFn: () => engine().matchPreview(matchId!), enabled: !!matchId, staleTime: 0, gcTime: 0 });
  const { data: h2h } = useQuery({ queryKey: ["match-h2h", match?.idolA, match?.idolB], queryFn: () => engine().headToHead(match!.idolA, match!.idolB), enabled: !!match, staleTime: 0 });
  if (!matchId || !match || match.id !== matchId) return null;
  const line = (l: { wins: number; draws: number; losses: number; titles: number } | null | undefined) => l ? [`${l.wins}-${l.draws}-${l.losses}`, String(l.titles)] : ["–", "–"];
  const [careerA, titlesA] = line(h2h?.lineA);
  const [careerB, titlesB] = line(h2h?.lineB);
  const facts = [
    { label: `This season · ${label(match.comp)}`, a: match.record.comp[0]!, b: match.record.comp[1]! },
    { label: "This season · all", a: match.record.all[0]!, b: match.record.all[1]! },
    { label: "Career W-D-L", a: careerA!, b: careerB! },
    { label: "Titles", a: titlesA!, b: titlesB! },
  ];

  const accept = async ({ method, games }: AcceptedResult) => {
    try {
      const r = await engine().acceptMatch(match.id, games, method);
      notify({ level: "success", message: `Result saved: ${r.scoreA}–${r.scoreB}` });
      if (match.comp === "UZC" && match.round === "F") { // the Unzure Cup grand final: celebrate its champion
        const a = r.result === "A";
        useCelebration.getState().show({ champion: a ? match.idolA : match.idolB, runnerUp: a ? match.idolB : match.idolA, score: a ? `${r.scoreA}–${r.scoreB}` : `${r.scoreB}–${r.scoreA}` });
      }
    } catch (error) {
      notify({ level: "error", code: "E-PLAY-002", message: "The match result wasn't saved.", context: error instanceof Error ? error.message : String(error) });
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
      theme={{
        accent: (/^D[12]|^BS/.test(match.comp) ? brand(match.comp.startsWith("BS") ? `D1${match.comp[2]}` : match.comp).color : undefined)
          ?? ACCENT[match.comp] ?? ACCENT[match.comp.slice(0, 2)],
        kicker: label(match.comp),
        grandFinal: match.round === "F" || match.round === "GF" || match.comp === "DSG",
      }}
      onAccept={accept}
    />
  );
}
