// Season Archive (PRD §8): pick a season, read it back (read-only): honours, season numbers, the 13 final
// league tables, every cup's top four, promotion/relegation and rating changes.
import { EmptyState, StatTile } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Archive } from "@sabung/ui/icons";
import { type ReactNode, useState } from "react";
import { ArchiveBrackets } from "../../components/archive/ArchiveBrackets";
import { RecapButton } from "../../components/archive/RecapButton";
import { ArchiveCups } from "../../components/archive/ArchiveCups";
import { ArchiveMovement } from "../../components/archive/ArchiveMovement";
import { ArchiveTables } from "../../components/archive/ArchiveTables";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { SeasonHonours } from "../../components/play/SeasonHonours";
import { engine } from "../../data/engineClient";
import type { seasonArchive } from "../../data/archiveWorker";
import { PageHeader } from "../../components/PageHeader";

type ArchiveData = Awaited<ReturnType<typeof seasonArchive>>; // Comlink splits a union of promises

export const Route = createFileRoute("/wiki/seasons")({ component: SeasonArchive });

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-3"><h2 className="section-title">{title}</h2>{children}</section>;
}

function SeasonArchive() {
  const { data: seasons } = useQuery({ queryKey: ["season-list"], queryFn: () => engine().seasonList(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const played = (seasons ?? []).filter((s) => s.status !== "draft");
  const [picked, setPicked] = useState<string>();
  const seasonId = played.some((s) => s.id === picked) ? picked : played[0]?.id; // a picked season that is gone (reset) falls back
  const { data: archive, isPending } = useQuery({ queryKey: ["season-archive", seasonId], queryFn: () => engine().seasonArchive(seasonId!) as Promise<ArchiveData>, staleTime: 0, enabled: !!seasonId });
  if (!seasons) return <p className="text-text-secondary">Loading season…</p>;
  if (!played.length) return <EmptyState icon={Archive} title="No seasons yet" description="A season shows in the archive once it starts." />;
  return (
    <div className="space-y-10">
      <PageHeader tag="Archive" title="Every season, archived" note="Pick a season to revisit its champions, final standings and rating changes." />
      <Select label="Season" value={seasonId!} onChange={setPicked} options={played.map((s): [string, string] => [s.id, `${s.name}${s.status === "live" ? " (live)" : ""}`])} />
      {isPending || !archive ? <p className="text-text-secondary">Loading season…</p>
        : !archive.done ? <p className="text-text-secondary">{archive.season.name} isn't finished — the archive fills in once every competition is done.</p>
        : (
          <>
            <SeasonHonours seasonId={seasonId!} titles={archive.titles} top={archive.seasonTop} />
            <RecapButton seasonName={archive.season.name} titles={archive.titles} />
            <div className="grid max-w-xl grid-cols-3 gap-3">
              <StatTile label="Match" value={archive.numbers.matches} />
              <StatTile label="Draws" value={archive.numbers.draws} />
              <StatTile label="Sweep" value={archive.numbers.sweeps} />
            </div>
            <Section title="Final standings"><ArchiveTables tables={archive.tables} /></Section>
            <Section title="Cup"><ArchiveCups cups={archive.cups} /></Section>
            <Section title="Brackets, Swiss and groups"><ArchiveBrackets key={seasonId} seasonId={seasonId!} /></Section>
            <Section title="Promotion, relegation, ratings"><ArchiveMovement promoted={archive.promoted} relegated={archive.relegated} ratingChanges={archive.ratingChanges} /></Section>
          </>
        )}
    </div>
  );
}
