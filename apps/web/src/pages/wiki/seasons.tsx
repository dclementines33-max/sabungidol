// Season Archive (PRD §8): pick a season, read it back (read-only): honours, season numbers, the 13 final
// league tables, every cup's top four, promotion/relegation and rating changes.
import { EmptyState, StatTile } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Archive } from "lucide-react";
import { type ReactNode, useState } from "react";
import { ArchiveCups } from "../../components/archive/ArchiveCups";
import { ArchiveMovement } from "../../components/archive/ArchiveMovement";
import { ArchiveTables } from "../../components/archive/ArchiveTables";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { SeasonHonours } from "../../components/play/SeasonHonours";
import { engine } from "../../data/engineClient";
import type { seasonArchive } from "../../data/archiveWorker";

type ArchiveData = Awaited<ReturnType<typeof seasonArchive>>; // Comlink splits a union of promises

export const Route = createFileRoute("/wiki/seasons")({ component: SeasonArchive });

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-3"><h2 className="m-0 font-display text-2xl uppercase">{title}</h2>{children}</section>;
}

function SeasonArchive() {
  const { data: seasons } = useQuery({ queryKey: ["season-list"], queryFn: () => engine().seasonList(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const played = (seasons ?? []).filter((s) => s.status !== "draft");
  const [picked, setPicked] = useState<string>();
  const seasonId = picked ?? played[0]?.id;
  const { data: archive, isPending } = useQuery({ queryKey: ["season-archive", seasonId], queryFn: () => engine().seasonArchive(seasonId!) as Promise<ArchiveData>, staleTime: 0, enabled: !!seasonId });
  if (!seasons) return <p className="text-text-secondary">Membaca season…</p>;
  if (!played.length) return <EmptyState icon={Archive} title="Belum ada season" description="Season muncul di arsip setelah dimulai." />;
  return (
    <div className="space-y-10">
      <Select label="Season" value={seasonId!} onChange={setPicked} options={played.map((s): [string, string] => [s.id, `${s.name}${s.status === "live" ? " (berjalan)" : ""}`])} />
      {isPending || !archive ? <p className="text-text-secondary">Membaca season…</p>
        : !archive.done ? <p className="text-text-secondary">{archive.season.name} belum selesai — arsipnya lengkap setelah semua kompetisi selesai.</p>
        : (
          <>
            <SeasonHonours titles={archive.titles} uzcThird={archive.uzcThird} />
            <div className="grid max-w-xl grid-cols-3 gap-3">
              <StatTile label="Match" value={archive.numbers.matches} />
              <StatTile label="Seri" value={archive.numbers.draws} />
              <StatTile label="Sweep" value={archive.numbers.sweeps} />
            </div>
            <Section title="Klasemen akhir"><ArchiveTables tables={archive.tables} /></Section>
            <Section title="Cup"><ArchiveCups cups={archive.cups} /></Section>
            <Section title="Promosi, degradasi, rating"><ArchiveMovement promoted={archive.promoted} relegated={archive.relegated} ratingChanges={archive.ratingChanges} /></Section>
          </>
        )}
    </div>
  );
}
