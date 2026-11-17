// Ranking (2026-11-17): the Sabung Index top 10 of idols or girl groups (podium + places 4–10, where the points come from),
// and My Top 10, the user's own order. The idols / girl groups switch drives both tabs.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { KindSwitch } from "../../components/KindSwitch";
import { PageHeader } from "../../components/PageHeader";
import { Tabs } from "../../components/competition/Tabs";
import { IndexLegend } from "../../components/ranking/IndexBar";
import { MyTop10 } from "../../components/ranking/MyTop10";
import { RankBoard } from "../../components/ranking/RankBoard";
import { RankPodium } from "../../components/ranking/RankPodium";
import { groupIndex, idolIndex } from "../../components/ranking/sabungIndex";
import { useEntries } from "../../components/ranking/useEntries";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { type Kind, useListsReady } from "../../data/userLists";

export const Route = createFileRoute("/wiki/ranking")({ component: Ranking });

const on = typeof Worker !== "undefined";

function Ranking() {
  const [kind, setKind] = useState<Kind>("idol");
  const ready = useListsReady();
  const entries = useEntries(kind);
  const { data: idols } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: on });
  const { data: combined } = useQuery({ queryKey: ["career-table", "ALL"], queryFn: () => engine().careerTable("ALL"), staleTime: 0, enabled: on });
  const { data: titles } = useQuery({ queryKey: ["titles-by-comp"], queryFn: () => engine().titlesByComp(), staleTime: 0, enabled: on });
  const { data: awards } = useQuery({ queryKey: ["award-history"], queryFn: () => engine().awardHistory(), staleTime: 0, enabled: on });
  const ranked = useMemo(() => {
    if (!idols || !combined || !titles || !awards) return null;
    const byIdol = idolIndex(idols, combined, titles, awards);
    return { idol: byIdol, group: groupIndex(idols, byIdol, awards) };
  }, [idols, combined, titles, awards]);
  if (!ranked || !entries || !ready) return <p className="text-text-secondary">Crunching the numbers…</p>;

  const rows = ranked[kind].filter((r) => entries.byId.has(r.id)).slice(0, 10).map((row) => ({ entry: entries.byId.get(row.id)!, row }));
  const played = (combined ?? []).some((r) => r.matches > 0);
  const plural = kind === "idol" ? "idols" : "girl groups";
  return (
    <div className="space-y-8">
      <PageHeader tag="Ranking" title="Who rules Sabung Idol" note="The Sabung Index puts everything in one number: titles by prestige, finals, awards, win rate, rating and feats. Or make your own top 10." />
      <KindSwitch value={kind} onChange={setKind} />
      <Tabs key={kind} label="Ranking" tabs={[
        { id: "index", label: "Sabung Index", content: () => (
          <div className="space-y-6">
            {!played && <p className="m-0 text-text-secondary">No matches yet, so the order is ratings only. Play a season and titles, awards and form take over.</p>}
            {rows.length > 0 && <RankPodium spots={rows.slice(0, 3).map(({ entry, row }) => ({ entry, score: row.score }))} caption={`Top three ${plural} · Sabung Index`} />}
            <IndexLegend />
            {rows.length > 3 && <RankBoard rows={rows.slice(3)} from={4} max={rows[0]!.row.score} />}
            <details className="panel p-4 text-sm text-text-secondary">
              <summary className="cursor-pointer font-display text-base text-text-primary">How the index is counted</summary>
              <ul className="m-0 mt-3 space-y-1 pl-5">
                <li>Titles: 12 points × the competition's prestige (Unzure Cup 1, The Idols 0.9, Division 1 0.8 … Division 2 0.25).</li>
                <li>Finals and podiums: 4 per runner-up, 2 per third place, 1 per final played.</li>
                <li>Awards: 16 for MVI or Idol of the Season, 8 for every other season award.</li>
                <li>Win rate: up to 40 points, counted in full from 60 matches.</li>
                <li>Rating: 0.6 per point above 50. Feats: giant kills, unbeaten seasons, reverse sweeps, the longest win streak.</li>
                <li>A girl group: the index of its best four members, plus 20 per MAMA.</li>
              </ul>
            </details>
          </div>
        ) },
        { id: "mine", label: "My Top 10", content: () => <MyTop10 kind={kind} entries={entries} suggested={ranked[kind].map((r) => r.id).filter((id) => entries.byId.has(id))} /> },
      ]} />
    </div>
  );
}
