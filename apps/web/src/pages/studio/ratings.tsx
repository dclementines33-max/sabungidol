// Rating Manager (PRD §6.4–6.6, §8): a draft of new ratings filled by edits and actions, a diff
// (old → new), and Revert / Discard / Save Now behind a confirmation. Nothing is written before Save;
// a save goes into rating_history. Engine Lab below.
import { readSeasonConfig } from "@sabung/shared";
import { Button, ConfirmDialog, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EngineLab } from "../../components/ratingManager/EngineLab";
import { RatingActions } from "../../components/ratingManager/RatingActions";
import { RatingList } from "../../components/ratingManager/RatingList";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { useCurrentSeason, useLeagueRosters } from "../../data/seasonQuery";
import { PageHeader } from "../../components/PageHeader";

export const Route = createFileRoute("/studio/ratings")({ component: RatingManager });

type Step = { draft: Map<string, number>; label: string };
const CONFIRM = {
  revert: { title: "Revert", message: "Undo the last change in the draft?", label: "Revert" },
  discard: { title: "Discard", message: "Discard every change in the draft? Saved ratings stay as they are.", label: "Discard" },
  save: { title: "Save Now", message: "Save the new ratings? Every change goes into the rating history.", label: "Save Now" },
} as const;

function RatingManager() {
  const { data: idols = [], isPending } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const season = useCurrentSeason();
  const rosters = useLeagueRosters(season?.id) ?? {};
  const lookup = useIdolLookup();
  const [steps, setSteps] = useState<Step[]>([]);
  const [confirm, setConfirm] = useState<keyof typeof CONFIRM | null>(null);
  if (isPending) return <p className="text-text-secondary">Loading database…</p>;

  const current = new Map(idols.map((i) => [i.id, i.rating]));
  const draft = steps.at(-1)?.draft ?? new Map<string, number>();
  const change = (changes: Map<string, number>, label: string) => {
    const next = new Map(draft);
    for (const [id, r] of changes) { if (current.get(id) === r) next.delete(id); else next.set(id, r); }
    setSteps([...steps, { draft: next, label }]);
  };
  const leagueOf = new Map(Object.entries(rosters).flatMap(([comp, ids]) => ids.map((id) => [id, comp] as const)));
  const diff = [...draft.entries()].sort((x, y) => y[1] - current.get(y[0])! - (x[1] - current.get(x[0])!));
  const act = async () => {
    if (confirm === "revert") setSteps(steps.slice(0, -1));
    if (confirm === "discard") setSteps([]);
    if (confirm === "save") {
      const reason = [...new Set(steps.map((s) => s.label))].join(", ");
      const { changed } = await engine().applyRatings(diff.map(([idolId, r]) => ({ idolId, new: r, reason })), "manager");
      setSteps([]);
      notify({ level: "success", message: `Ratings saved for ${changed} idols` });
      await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    }
  };

  return (
    <div className="studio-flow space-y-8">
      <PageHeader tag="Rating Manager" title="Set every idol's strength" note="Rating proposals for next season, presets and the Engine Lab." />
      <section aria-labelledby="draft" className="studio-section space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <h2 id="draft" className="m-0 flex-1 font-display">Draft: <span className={`font-gothic text-2xl ${diff.length ? "text-brand-gold" : "text-text-secondary"}`}>{diff.length}</span> changes</h2>
          <Button disabled={!steps.length} onClick={() => setConfirm("revert")}>Revert{steps.length ? ` (${steps.at(-1)!.label})` : ""}</Button>
          <Button disabled={!steps.length} onClick={() => setConfirm("discard")}>Discard</Button>
          <Button variant="primary" disabled={!diff.length} onClick={() => setConfirm("save")}>Save Now</Button>
        </div>
        {diff.length > 0 && (
          <details className="panel">
            <summary className="cursor-pointer px-3 py-2">Preview diff (old → new)</summary>
            <ul tabIndex={0} aria-label="Rating changes" className="m-0 max-h-64 list-none overflow-auto px-3 pb-3 text-sm focus-visible:outline-2 focus-visible:outline-accent-bright">
              {diff.map(([id, r]) => <li key={id}>{lookup(id)?.name} <span className="font-mono tabular-nums">{current.get(id)} → {r}</span></li>)}
            </ul>
          </details>
        )}
      </section>
      <section aria-labelledby="table" className="studio-section space-y-3">
        <h2 id="table" className="m-0 font-display">Ratings</h2>
        <RatingList idols={idols} leagueOf={leagueOf} draft={draft} onChange={change} />
      </section>
      <section aria-labelledby="actions" className="studio-section space-y-3">
        <h2 id="actions" className="m-0 font-display">Presets</h2>
        <RatingActions idols={idols} onChange={change} />
      </section>
      <section aria-labelledby="lab" className="studio-section space-y-3">
        <h2 id="lab" className="m-0 font-display">Engine Lab</h2>
        <EngineLab idolIds={idols.filter((i) => i.active).map((i) => i.id)} ratingOf={(id) => draft.get(id) ?? current.get(id) ?? 75} tuning={readSeasonConfig(season?.config).tuning} />
      </section>
      {confirm && (
        <ConfirmDialog open onOpenChange={(open) => { if (!open) setConfirm(null); }} title={CONFIRM[confirm].title} message={CONFIRM[confirm].message}
          confirmLabel={CONFIRM[confirm].label} danger={confirm === "discard"} onConfirm={act} />
      )}
    </div>
  );
}
