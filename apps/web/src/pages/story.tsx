// Season Story (PRD §8): an automatic news feed for a season — first titles, upsets, reverse sweeps,
// streaks and the Idol of the Month per 10 matchdays — as editorial cards.
import { EmptyState } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { useState } from "react";
import { Select } from "../components/idolDatabase/IdolFilters";
import { StoryCard } from "../components/story/StoryCard";
import { engine } from "../data/engineClient";

export const Route = createFileRoute("/story")({ component: SeasonStory });

function SeasonStory() {
  const { data: seasons } = useQuery({ queryKey: ["season-list"], queryFn: () => engine().seasonList(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const played = (seasons ?? []).filter((s) => s.status !== "draft");
  const [picked, setPicked] = useState<string>();
  const seasonId = picked ?? played[0]?.id;
  const { data: stories } = useQuery({ queryKey: ["season-story", seasonId], queryFn: () => engine().seasonStory(seasonId!), staleTime: 0, enabled: !!seasonId });
  if (!seasons) return <p className="text-text-secondary">Membaca season…</p>;
  if (!played.length) return <EmptyState icon={Newspaper} title="Belum ada berita" description="Season Story terisi begitu season dimainkan." />;
  return (
    <div className="space-y-6">
      <Select label="Season" value={seasonId!} onChange={setPicked} options={played.map((s): [string, string] => [s.id, s.name])} />
      {!stories ? <p className="text-text-secondary">Menulis berita…</p> : stories.length === 0 ? <p className="text-text-secondary">Belum ada match di season ini.</p> : (
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3" aria-label="Berita season">
          {stories.map((s, i) => <li key={i} className="flex"><StoryCard story={s} /></li>)}
        </ul>
      )}
    </div>
  );
}
