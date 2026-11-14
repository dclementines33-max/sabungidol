// Dashboard's Division 1 (Update 2): pick one of the six D1 leagues; its title race (points of the top 5 after every
// matchday) beside a slim table coloured by zone.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { D1_LEAGUES } from "@sabung/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { LineRace } from "../charts/LineRace";
import { pointsByMatchday } from "../charts/titleRace";
import { CompetitionLogo } from "../CompetitionLogo";

const zone = (rank: number) => (rank <= 6 ? "bg-accent/25" : rank <= 16 ? "bg-cool/10" : rank >= 18 ? "bg-danger/15" : "");

export function D1Board() {
  const { brand } = useBranding();
  const lookup = useIdolLookup();
  const [comp, setComp] = useState<string>(D1_LEAGUES[0]);
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "league", comp], queryFn: () => engine().leagueView(comp) });
  const top = view?.standings.slice(0, 5).map((r) => r.idolId) ?? [];
  const race = view ? pointsByMatchday(view.fixtures, top) : {};
  return (
    <section aria-label="Division 1" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker m-0">Division 1 · title race</p>
          <h2 className="m-0 text-[clamp(2rem,5vw,3.75rem)]">{brand(comp).name}</h2>
        </div>
        <div role="group" aria-label="Pick a Division 1 league" className="flex flex-wrap gap-1">
          {D1_LEAGUES.map((c) => (
            <button key={c} type="button" aria-pressed={c === comp} onClick={() => setComp(c)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase ${c === comp ? "bg-accent text-on-accent" : "bg-surface-hover/60 text-text-secondary hover:text-text-primary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>
              <CompetitionLogo logoId={brand(c).logoId} className="size-5" />{c}
            </button>
          ))}
        </div>
      </div>
      {!view ? <p className="m-0 text-sm text-text-secondary">Loading league…</p> : (
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-[1.6]">
            <LineRace label={`Title race ${brand(comp).name}`} series={top.map((id) => ({ id, values: race[id] ?? [0] }))} />
          </div>
          <table aria-label={`Standings ${brand(comp).name}`} className="w-full flex-1 border-collapse text-sm tabular-nums xl:-mt-16">
            <thead><tr className="text-left text-[10px] tracking-[0.18em] text-text-secondary uppercase">{["#", "Idol", "P", "±", "Pts"].map((h) => <th key={h} scope="col" className="px-1 pb-1 font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {view.standings.map((r) => (
                <tr key={r.idolId} className={zone(r.rank)}>
                  <td className="px-1 font-display">{r.rank}</td>
                  <td className="px-1"><span className="flex items-center gap-2"><IdolPhoto idolId={r.idolId} size={64} className="h-6 w-5" /><span className="max-w-36 truncate">{lookup(r.idolId)?.name}</span></span></td>
                  <td className="px-1 font-mono">{r.played}</td>
                  <td className="px-1 font-mono">{r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}</td>
                  <td className="px-1 font-display">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="kicker m-0 flex flex-wrap gap-4 text-text-secondary">
        <span><span className="mr-1 inline-block size-2 bg-accent" />1–6 Unzure Cup</span>
        <span><span className="mr-1 inline-block size-2 bg-cool" />7–16 Swiss Play-in</span>
        <span><span className="mr-1 inline-block size-2 bg-danger" />18–20 relegated</span>
      </p>
    </section>
  );
}
