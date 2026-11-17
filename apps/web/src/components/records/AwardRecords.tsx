// All-time Records → Awards (2026-11-17): one leaderboard per season award, in award order — who won it, how often and
// in which seasons (ranked by wins, ties share a rank). MAMA lists girl groups. Data: the career cache (award history).
import { AWARDS, rankLabel, rankRecords } from "@sabung/engine";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { engine } from "../../data/engineClient";
import { LEAGUE_ARENAS } from "../competition/arenaTheme";
import { AWARD_TEXT } from "../play/awardText";
import { IdolLink } from "../wiki/IdolLink";
import { RecordCard, type RecordRow } from "./RecordCard";

type Win = { season: number; key: string; id: string };

export function AwardRecords({ history, hit }: { history: Win[]; hit: (id: string) => boolean }) {
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => engine().listGroups(), enabled: typeof Worker !== "undefined" });
  const rowsOf = (key: string): RecordRow[] => {
    const seasons = new Map<string, number[]>();
    for (const w of history) if (w.key === key) seasons.set(w.id, [...(seasons.get(w.id) ?? []), w.season]);
    return rankRecords([...seasons].map(([id, ns]) => ({ idolId: id, value: ns.length, matches: 0 })), "total")
      .filter((e) => key === "mama" || hit(e.idolId))
      .map((e) => {
        const tag = <span className="text-text-secondary">{seasons.get(e.idolId)!.map((n) => `S${n}`).join(" · ")}</span>;
        const who = key === "mama"
          ? <Link to="/wiki/group/$id" params={{ id: e.idolId }} className="underline-offset-4 hover:underline">{groups.find((g) => g.id === e.idolId)?.name ?? e.idolId}</Link>
          : <IdolLink id={e.idolId} />;
        return { key: e.idolId, idolId: key === "mama" ? undefined : e.idolId, rank: rankLabel(e), who: <>{who} {tag}</>, value: `${e.value}×` };
      });
  };
  return (
    <section aria-labelledby="award-records" className="space-y-3">
      <h2 id="award-records" className="kicker m-0">Awards</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AWARDS.map((key, i) => <RecordCard key={key} title={AWARD_TEXT[key].name} rows={rowsOf(key)} arena={LEAGUE_ARENAS[i % 6]!.arena} />)}
      </div>
    </section>
  );
}
