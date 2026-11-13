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

export function SeasonClose({ done }: { done: boolean }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: close } = useQuery({ queryKey: [...SEASON_QUERY, "close"], queryFn: () => engine().closePreview(), enabled: done });

  const block = (blockers: string[]) => notify({ level: "blocker", message: `Start New Season diblokir: ${blockers.join(", ")} belum selesai` });
  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    try { await job(); } catch (error) {
      notify({ level: "error", code: "E-SEASON-002", message: "Penutupan season gagal. Data tidak berubah.", context: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
      await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
      await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    }
  };
  const saveRatings = () => run(async () => {
    const { changed } = await engine().saveProgression();
    notify({ level: "success", message: `Rating ${changed} idol diperbarui` });
  });
  const startNew = () => run(async () => {
    const result = await engine().startNewSeason();
    if (result.ok) notify({ level: "success", message: `${result.name} dibuat sebagai draft` });
    else block(result.blockers);
  });

  return (
    <section aria-labelledby="season-close" className="space-y-4">
      <h2 id="season-close" className="m-0 font-display text-xl">Tutup season</h2>
      {!done && <Button onClick={() => engine().closePreview().then((c) => block(c.blockers))}>Start New Season</Button>}
      {done && close && (
        <>
          {close.badges.length > 0 && (
            <div>
              <h3 className="m-0 mb-2 text-sm font-medium">Badge baru season ini</h3>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {close.badges.map((b) => <li key={`${b.idolId}-${b.badge}`} className="rounded-control border border-accent-bright px-2 py-1 text-sm"><span className="text-accent-bright">{BADGES[b.badge]}</span> · {name(b.idolId)}</li>)}
              </ul>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {([["Promosi ke D1 (+2)", close.promoted], ["Degradasi ke D2 (−2)", close.relegated]] as const).map(([title, ids]) => (
              <div key={title}><h3 className="m-0 mb-1 text-sm font-medium">{title}</h3><p className="m-0 text-sm text-text-secondary">{ids.map(name).join(", ")}</p></div>
            ))}
          </div>
          <details className="rounded-card border border-border bg-bg-raised">
            <summary className="cursor-pointer px-3 py-2">Rating Progression: {close.progression.length} idol berubah (opsional)</summary>
            <div tabIndex={0} role="region" aria-label="Perubahan rating" className="max-h-96 overflow-auto px-3 pb-3 focus-visible:outline-2 focus-visible:outline-accent-bright">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-text-secondary"><th scope="col">Idol</th><th scope="col">Rating</th><th scope="col">Alasan</th></tr></thead>
                <tbody>
                  {close.progression.map((r) => (
                    <tr key={r.idolId}><td>{name(r.idolId)}</td><td className="font-mono tabular-nums">{r.current} → {r.new}</td><td className="text-text-secondary">{r.reason}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy || close.progression.length === 0} onClick={saveRatings}>Simpan rating</Button>
            <Button variant="primary" disabled={busy} onClick={() => setConfirm(true)}>Start New Season</Button>
          </div>
        </>
      )}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Start New Season"
        message="Season ini diarsipkan (read-only) dan season baru dibuat sebagai draft dengan roster setelah promosi/degradasi. Snapshot dibuat dulu."
        confirmLabel="Start New Season" onConfirm={startNew} />
    </section>
  );
}
