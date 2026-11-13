// Settings → Roster liga (PRD §8): a card per league with its branding and count, every problem of all
// 12 leagues in one list under the cards; editing goes through the LeagueRosterModal. Only while the season is a draft.
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { LeagueRosterModal, useIdolLookup } from "@sabung/ui";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { CompetitionLogo } from "../CompetitionLogo";
import { rosterProblems } from "./rosterProblems";
import { SECTION, refreshSeason } from "./settingsShared";

export function RosterSettings({ seasonId, draft, rosters, activeIds }: { seasonId: string; draft: boolean; rosters: Record<string, string[]>; activeIds: string[] }) {
  const [league, setLeague] = useState<string | null>(null);
  const { brand } = useBranding();
  const lookup = useIdolLookup();
  const problems = rosterProblems(rosters, activeIds, (id) => lookup(id)?.name ?? id);
  const leagueOf = (id: string) => Object.entries(rosters).find(([, ids]) => ids.includes(id))?.[0] ?? null;
  const apply = async (code: string, roster: string[]) => {
    try {
      await engine().setLeagueRosters(seasonId, { [code]: roster });
      notify({ level: "success", message: `Roster ${brand(code).name} disimpan` });
      await refreshSeason();
    } catch (error) {
      notify({ level: "error", code: "E-ROSTER-001", message: "Roster tidak disimpan.", context: String(error) });
    }
  };
  return (
    <section className={SECTION} aria-labelledby="set-roster">
      <h2 id="set-roster" className="m-0 font-display text-lg">Roster liga</h2>
      {!draft && <p className="m-0 text-sm text-text-secondary">Season sudah berjalan: roster diubah lewat alur season (Fase 3).</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...D1_LEAGUES, ...D2_LEAGUES].map((code) => {
          const n = rosters[code]?.length ?? 0;
          const b = brand(code);
          const bad = problems.some((p) => p.league === code);
          return (
            <button key={code} type="button" disabled={!draft} onClick={() => setLeague(code)}
              aria-label={`${code} ${b.name} ${n}/20 idol${bad ? ", ada masalah" : ""}`}
              className="flex items-center gap-3 rounded-card border border-border border-l-4 bg-surface p-3 text-left hover:bg-surface-hover disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent-bright"
              style={{ borderLeftColor: b.color ? `var(--color-${b.color})` : undefined }}>
              <CompetitionLogo logoId={b.logoId} className="size-10" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{b.name}</span>
                <span className="font-mono text-xs text-text-secondary">{code}</span>
              </span>
              <span className={`font-mono text-sm tabular-nums ${bad ? "text-danger" : "text-text-secondary"}`}>{n}/20</span>
            </button>
          );
        })}
      </div>
      {problems.length > 0
        ? (
          <div role="alert" className="rounded-card border border-danger p-3">
            <h3 className="m-0 mb-1 text-sm font-medium text-danger">{problems.length} masalah roster</h3>
            <ul className="m-0 space-y-1 pl-5 text-sm">{problems.map((p) => <li key={`${p.league}-${p.text}`}><span className="font-mono">{p.league}</span> {brand(p.league).name}: {p.text}</li>)}</ul>
          </div>
        )
        : <p className="m-0 text-sm text-text-secondary">Semua 12 roster beres.</p>}
      {league && (
        <LeagueRosterModal open onOpenChange={(open) => !open && setLeague(null)} league={league} title={brand(league).name}
          logo={<CompetitionLogo logoId={brand(league).logoId} className="size-8" />} roster={rosters[league] ?? []}
          idolIds={activeIds} leagueOf={leagueOf} onApply={(roster) => { apply(league, roster); setLeague(null); }} />
      )}
    </section>
  );
}
