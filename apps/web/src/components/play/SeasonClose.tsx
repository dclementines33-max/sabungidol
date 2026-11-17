// Closing the season (PRD §4, §6.3) on the simulator page: Rating Progression (preview → save,
// optional), promotion/relegation preview, and "Start New Season" behind the archive guard.
import { BADGES } from "@sabung/shared";
import { Button, ConfirmDialog, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { SeasonVerdict } from "./SeasonVerdict";
import { withNames } from "./usePlaySeason";

export function SeasonClose({ done }: { done: boolean }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState(false);
  const { data: close } = useQuery({ queryKey: [...SEASON_QUERY, "close"], queryFn: () => engine().closePreview(), enabled: done });

  const block = (blockers: string[]) => notify({ level: "blocker", message: `Start New Season is blocked: ${blockers.join(", ")} not finished` });
  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    try { await job(); } catch (error) {
      notify({ level: "error", code: "E-SEASON-002", message: "Closing the season failed. Nothing changed.", context: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
      await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
      await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    }
  };
  const saveRatings = () => run(async () => {
    const { changed } = await engine().saveProgression();
    notify({ level: "success", message: `Ratings updated for ${changed} idols` });
    setVerdict(false);
  });
  const startNew = () => run(async () => {
    const result = await engine().startNewSeason();
    if (result.ok) {
      notify({ level: "success", message: `${result.name} created as a draft` });
      result.notices.forEach((message) => notify({ level: "info", message: withNames(message, (id) => lookup(id)?.name) }));
    }
    else block(result.blockers);
  });

  return (
    <section aria-labelledby="season-close" className="space-y-4">
      <h2 id="season-close" className="section-title">Close the season</h2>
      {!done && <Button onClick={() => engine().closePreview().then((c) => block(c.blockers))}>Start New Season</Button>}
      {done && close && (
        <>
          {close.badges.length > 0 && (
            <div>
              <h3 className="m-0 mb-2 text-sm font-medium">New badges this season</h3>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {close.badges.map((b) => <li key={`${b.idolId}-${b.badge}`} className="rounded-control bg-accent/40 px-2 py-1 text-sm"><span className="text-accent-bright">{BADGES[b.badge]}</span> · {name(b.idolId)}</li>)}
              </ul>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {([["Promoted to D1 (+2)", close.promoted], ["Relegated to D2 (−2)", close.relegated]] as const).map(([title, ids]) => (
              <div key={title}><h3 className="m-0 mb-1 text-sm font-medium">{title}</h3><p className="m-0 text-sm text-text-secondary">{ids.map(name).join(", ")}</p></div>
            ))}
          </div>
          <p className="m-0 text-sm text-text-secondary">Rating Progression: {close.progression.length} idols change (optional). Save ratings to see the season verdict first.</p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy || close.progression.length === 0} onClick={() => setVerdict(true)}>Save ratings…</Button>
            <Button variant="primary" disabled={busy} onClick={() => setConfirm(true)}>Start New Season</Button>
          </div>
        </>
      )}
      {close && <SeasonVerdict open={verdict} onOpenChange={setVerdict} rows={close.progression} targets={close.targets} busy={busy} onSave={saveRatings} />}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Start New Season"
        message="This season is archived (read-only) and a new season is created as a draft with the post-promotion/relegation rosters. A snapshot is made first."
        confirmLabel="Start New Season" onConfirm={startNew} />
    </section>
  );
}
