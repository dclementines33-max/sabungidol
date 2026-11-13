// A cup panel (PRD §8): the champion once known, the bracket (played and next matches), and play
// controls for the next round or the rest of the cup. Several codes (B-Side A–F) get a switcher.
import { Button, IdolCard, TournamentBracketTree } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import { useBranding } from "../../data/branding";
import { PlayMatchDialog } from "../play/PlayMatchDialog";
import { usePlaySeason } from "../play/usePlaySeason";

export function CupPanel({ codes, title }: { codes: string[]; title?: string }) {
  const { label } = useBranding();
  const season = useCurrentSeason();
  const [comp, setComp] = useState(codes[0]!);
  const [matchId, setMatchId] = useState<string | null>(null);
  const { progress, running, play } = usePlaySeason();
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "cup", comp, season?.status], queryFn: () => engine().cupView([comp]), enabled: season?.status === "live" });
  if (!season || season.status === "draft") return <p className="text-text-secondary">Mulai season di Sabung Idol untuk memainkan cup ini.</p>;
  if (!view) return <p className="text-text-secondary">Membaca cup…</p>;
  const next = view.cells.find((c) => !c.winner);
  return (
    <section className="space-y-6" aria-label={title ?? comp}>
      {title && <h2 className="m-0 font-display text-xl">{title}</h2>}
      {codes.length > 1 && (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Cup">
          {codes.map((c) => <Button key={c} aria-pressed={c === comp} className={`px-3 font-mono ${c === comp ? "bg-surface-hover" : ""}`} onClick={() => setComp(c)}>{c}</Button>)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || !next} onClick={() => play({ kind: "round", comp: next!.comp, stage: next!.stage, round: next!.round })}>Main ronde berikutnya</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "comps", comps: [comp] })}>Main sampai selesai</Button>
        {progress && <span role="status" className="text-sm text-text-secondary">Memainkan… {progress.done}</span>}
        {!next && view.cells.length === 0 && <span className="text-sm text-text-secondary">{comp === "DSG" || comp === "MBK" ? "Dimainkan sebagai pembuka season berikutnya, antara juara season ini." : "Menunggu fase sebelumnya selesai."}</span>}
      </div>
      {Object.entries(view.titles).length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
          {Object.entries(view.titles).map(([key, t]) => (
            <li key={key} className="space-y-2"><p className="m-0 text-xs tracking-widest text-text-secondary uppercase">Juara {label(key)}</p><IdolCard idolId={t!.champion} /></li>
          ))}
        </ul>
      )}
      {view.cells.length > 0 && <TournamentBracketTree cells={view.cells} onMatchClick={(cell) => { const match = view.cells.find((c) => c.key === cell.key); if (match && !match.winner && !running) setMatchId(match.id); }} />}
      <PlayMatchDialog matchId={matchId} onClose={() => setMatchId(null)} />
    </section>
  );
}
