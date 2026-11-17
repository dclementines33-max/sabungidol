// All-time Records → Awards (2026-11-17, user: "like the Hall of Champions", own section in the same panel): one tab per
// season award, each like a Hall of Champions tab — the winners as a poster wall (most wins first), then the winner of
// every season with the award's number. MAMA lists girl groups (logo, name). Data: the award history (career cache).
import { AWARDS } from "@sabung/engine";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { engine } from "../../data/engineClient";
import { ChampionList } from "../champions/ChampionList";
import { WallOfFame } from "../champions/WallOfFame";
import { CompetitionLogo } from "../CompetitionLogo";
import { Tabs } from "../competition/Tabs";
import { AWARD_TEXT } from "../play/awardText";

type Win = { season: number; key: string; id: string; value: number };

function GroupHall({ wins }: { wins: Win[] }) {
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => engine().listGroups(), enabled: typeof Worker !== "undefined" });
  return (
    <ol className="m-0 list-none space-y-8 p-0" aria-label="MAMA by season">
      {wins.map((w) => {
        const g = groups.find((x) => x.id === w.id);
        return (
          <li key={w.season} className="flex items-center gap-5">
            <span aria-hidden="true" className="w-20 shrink-0 font-gothic text-[clamp(2.5rem,6vw,4rem)] leading-none text-accent/40">{w.season}</span>
            <CompetitionLogo logoId={g?.logoId} className="size-16 shrink-0" />
            <div className="min-w-0">
              <p className="kicker m-0">Season {w.season}</p>
              <Link to="/wiki/group/$id" params={{ id: w.id }} className="block truncate font-display text-2xl hover:text-accent-bright focus-visible:outline-2 focus-visible:outline-accent-bright">{g?.name ?? w.id}</Link>
              <p className="m-0 font-mono text-sm text-text-secondary">{AWARD_TEXT.mama.value(w.value)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function AwardHall({ history }: { history: Win[] }) {
  return (
    <Tabs label="Award" tabs={AWARDS.map((key) => {
      const t = AWARD_TEXT[key];
      const wins = history.filter((w) => w.key === key).sort((a, b) => b.season - a.season);
      return {
        id: key, label: t.name,
        content: () => (
          <div className="space-y-8">
            <header>
              <h3 className="m-0 font-gothic text-3xl text-accent-bright">{t.name}</h3>
              <p className="m-0 font-display text-lg">{t.what}</p>
              <p className="m-0 text-sm text-text-secondary">{t.how}</p>
            </header>
            {!wins.length ? <p className="text-text-secondary">No {t.name} winner yet.</p>
              : key === "mama" ? <GroupHall wins={wins} />
              : <>
                  <WallOfFame champions={wins.map((w) => w.id)} title="Most wins" unit="wins" />
                  <ChampionList titles={wins.map((w) => ({ season: w.season, key, champion: w.id, runnerUp: null, score: null, detail: t.value(w.value) }))} />
                </>}
          </div>
        ),
      };
    })} />
  );
}
