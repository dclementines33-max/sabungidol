// Season Progression (Update 2): what happened in this season as charts — the six D1 title races, one league's
// positions over time, how far every competition is, and which girl groups took this season's titles.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bump } from "../../components/progression/Bump";
import { RaceGrid } from "../../components/progression/RaceGrid";
import { TitleShare } from "../../components/progression/TitleShare";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";

export const Route = createFileRoute("/wiki/progression")({ component: Progression });

// Matches a full competition plays in a season (PRD §4 table), to draw how far along each one is.
const PLANNED: Record<string, number> = { D1: 2280, D2: 2280, IDL: 398, SWS: 132, LCQ: 30, UZC: 128, INK: 8, NUG: 239, BS: 90, DSG: 1, MBK: 6 };

function Chapter({ n, title, note, children }: { n: string; title: string; note: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`ch-${n}`} className="relative isolate space-y-5">
      <span aria-hidden="true" className="absolute -top-8 -left-2 -z-10 font-gothic text-[6rem] leading-none text-accent/25">{n}</span>
      <h2 id={`ch-${n}`} className="m-0 text-[clamp(1.75rem,4vw,3rem)]">{title}</h2>
      <p className="m-0 max-w-prose text-text-secondary">{note}</p>
      {children}
    </section>
  );
}

function Progression() {
  const season = useCurrentSeason();
  const live = season?.status === "live";
  const { data: o } = useQuery({ queryKey: [...SEASON_QUERY, "overview", season?.id, season?.status], queryFn: () => engine().seasonOverview(), enabled: live });
  if (!season) return <p className="text-text-secondary">Membaca season…</p>;
  if (!live) return <p className="text-text-secondary">Season Progression tampil saat season sedang berjalan.</p>;
  return (
    <div className="space-y-20">
      <header>
        <p className="m-0 flex items-center gap-3"><span className="tag">Season Progression</span><span className="kicker">{season.name}</span></p>
        <h2 className="m-0 mt-3 text-[clamp(2.5rem,7vw,5.5rem)]">Jalan cerita season</h2>
      </header>
      <Chapter n="01" title="Title race Divisi 1" note="Poin tiga teratas tiap liga setelah setiap matchday.">
        <RaceGrid />
      </Chapter>
      <Chapter n="02" title="Naik turun klasemen" note="Posisi enam teratas saat ini dari matchday ke matchday. Garis paling atas = peringkat 1.">
        <Bump />
      </Chapter>
      <div className="flex flex-col gap-16 lg:flex-row">
        <div className="flex-1">
          <Chapter n="03" title="Seberapa jauh" note="Match yang sudah dimainkan dari total tiap kompetisi.">
            {o && (
              <ul className="m-0 list-none space-y-2 p-0" aria-label="Kemajuan kompetisi">
                {o.competitions.filter((c) => c.status !== "off").map((c) => {
                  const share = c.status === "finished" ? 1 : Math.min(1, c.played / (PLANNED[c.key] ?? 1));
                  return (
                    <li key={c.key} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm">
                      <span className="truncate">{c.name}</span>
                      <span aria-hidden="true" className="h-2 bg-surface-hover/50"><span className="block h-full bg-cool" style={{ width: `${share * 100}%` }} /></span>
                      <span className="text-right font-mono tabular-nums">{Math.round(share * 100)}%</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Chapter>
        </div>
        <div className="flex-1 lg:mt-24">
          <Chapter n="04" title="Gelar per girl group" note="Juara setiap kompetisi season ini, dikelompokkan per grup.">
            {o && <TitleShare titles={o.titles as Record<string, { champion: string } | undefined>} />}
          </Chapter>
        </div>
      </div>
    </div>
  );
}
