// Season Story (PRD §8): an automatic news feed for a season — first titles, upsets, reverse sweeps,
// streaks and the Idol of the Month per 10 matchdays — as editorial cards, most important first (newsScore), so the
// lead story is the biggest one.
import { newsScore } from "@sabung/engine";
import { EmptyState } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { useState } from "react";
import { Select } from "../components/idolDatabase/IdolFilters";
import { StoryCard } from "../components/story/StoryCard";
import { engine } from "../data/engineClient";
import { PageHeader } from "../components/PageHeader";

export const Route = createFileRoute("/story")({ component: SeasonStory });

function SeasonStory() {
  const { data: seasons } = useQuery({ queryKey: ["season-list"], queryFn: () => engine().seasonList(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const played = (seasons ?? []).filter((s) => s.status !== "draft");
  const [picked, setPicked] = useState<string>();
  const seasonId = picked ?? played[0]?.id;
  const { data: stories } = useQuery({ queryKey: ["season-story", seasonId], queryFn: () => engine().seasonStory(seasonId!), staleTime: 0, enabled: !!seasonId });
  if (!seasons) return <p className="text-text-secondary">Loading season…</p>;
  if (!played.length) return <EmptyState icon={Newspaper} title="No stories yet" description="Season Story fills up as the season is played." />;
  return (
    <div className="space-y-6">
      <PageHeader tag="Season Story" title="Stories from every season" note="Upsets, records and drama, written up automatically." />
      <Select label="Season" value={seasonId!} onChange={setPicked} options={played.map((s): [string, string] => [s.id, s.name])} />
      {!stories ? <p className="text-text-secondary">Writing the stories…</p> : stories.length === 0 ? <p className="text-text-secondary">No matches this season yet.</p> : (
        <ul className="m-0 list-none gap-8 p-0 md:columns-2 xl:columns-3" aria-label="Season stories">
          {[...stories].sort((a, b) => newsScore(b) - newsScore(a)).map((s, i) => <li key={i} className={`mb-6 flex break-inside-avoid ${i === 0 ? "[column-span:all] mb-10" : ""}`}><StoryCard story={s} lead={i === 0} /></li>)}
        </ul>
      )}
    </div>
  );
}
