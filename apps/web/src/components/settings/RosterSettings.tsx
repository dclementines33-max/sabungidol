// Settings → Roster liga (PRD §8): each of the 12 leagues with its count; editing goes through the
// LeagueRosterModal. Only while the season is a draft.
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { Button, LeagueRosterModal } from "@sabung/ui";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { SECTION, refreshSeason } from "./settingsShared";

export function RosterSettings({ seasonId, draft, rosters, activeIds }: { seasonId: string; draft: boolean; rosters: Record<string, string[]>; activeIds: string[] }) {
  const [league, setLeague] = useState<string | null>(null);
  const leagueOf = (id: string) => Object.entries(rosters).find(([, ids]) => ids.includes(id))?.[0] ?? null;
  const apply = async (code: string, roster: string[]) => {
    try {
      await engine().setLeagueRosters(seasonId, { [code]: roster });
      notify({ level: "success", message: `Roster ${code} disimpan` });
      await refreshSeason();
    } catch (error) {
      notify({ level: "error", code: "E-ROSTER-001", message: "Roster tidak disimpan.", context: String(error) });
    }
  };
  return (
    <section className={SECTION} aria-labelledby="set-roster">
      <h2 id="set-roster" className="m-0 font-display text-lg">Roster liga</h2>
      {!draft && <p className="m-0 text-sm text-text-secondary">Season sudah berjalan: roster diubah lewat alur season (Fase 3).</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[...D1_LEAGUES, ...D2_LEAGUES].map((code) => {
          const n = rosters[code]?.length ?? 0;
          return (
            <Button key={code} disabled={!draft} onClick={() => setLeague(code)} className="flex-col">
              <span className="font-mono">{code}</span>
              <span className={`text-xs ${n === 20 ? "text-text-secondary" : "text-danger"}`}>{n}/20 idol</span>
            </Button>
          );
        })}
      </div>
      {league && (
        <LeagueRosterModal open onOpenChange={(open) => !open && setLeague(null)} league={league} roster={rosters[league] ?? []}
          idolIds={activeIds} leagueOf={leagueOf} onApply={(roster) => { apply(league, roster); setLeague(null); }} />
      )}
    </section>
  );
}
