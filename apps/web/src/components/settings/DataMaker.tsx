// Settings → Data Maker (PRD §8; user decision 2026-11-13): split the active idols over the 12
// leagues again by the approved rule, see each league's strength first, then apply to the draft.
// The Unzure Cup pot preview comes in Fase 3, once there are standings.
import type { IdolRow } from "@sabung/db";
import { Button, ConfirmDialog } from "@sabung/ui";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { SECTION, refreshSeason } from "./settingsShared";

type Split = { leagues: Record<string, string[]>; reserves: string[] };

export function DataMaker({ seasonId, draft, idols }: { seasonId: string; draft: boolean; idols: IdolRow[] }) {
  const [split, setSplit] = useState<Split | null>(null);
  const [confirm, setConfirm] = useState(false);
  const rating = new Map(idols.map((i) => [i.id, i.rating]));
  const avg = (ids: string[]) => (ids.reduce((s, id) => s + (rating.get(id) ?? 0), 0) / ids.length).toFixed(1);
  const preview = async () => {
    try {
      setSplit(await engine().previewSplit());
    } catch (error) {
      notify({ level: "warning", code: "W-SPLIT-001", message: error instanceof Error ? error.message : String(error) });
    }
  };
  const apply = async () => {
    await engine().setLeagueRosters(seasonId, split!.leagues);
    notify({ level: "success", message: "12 liga dibagi ulang" });
    setSplit(null);
    await refreshSeason();
  };
  return (
    <section className={SECTION} aria-labelledby="set-maker">
      <h2 id="set-maker" className="m-0 font-display text-lg">Data Maker</h2>
      <p className="m-0 text-sm text-text-secondary">120 rating tertinggi ke Divisi 1, 120 berikutnya ke Divisi 2, dibagi pola ular ke 6 liga; seed 1–4 disebar rata. Sisanya cadangan.</p>
      <Button disabled={!draft} onClick={preview}>Pratinjau pembagian ulang</Button>
      {split && (
        <>
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 text-sm sm:grid-cols-3 lg:grid-cols-6" aria-label="Pratinjau liga">
            {Object.entries(split.leagues).map(([code, ids]) => (
              <li key={code} className="rounded-control bg-surface/40 p-2"><span className="font-mono">{code}</span><span className="block text-text-secondary">{ids.length} idol · rata-rata {avg(ids)}</span></li>
            ))}
          </ul>
          <p className="m-0 text-sm text-text-secondary">{split.reserves.length} cadangan</p>
          <Button variant="primary" onClick={() => setConfirm(true)}>Terapkan ke season…</Button>
        </>
      )}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Bagi ulang 12 liga?" message="Roster semua liga di season draft ini diganti dengan pembagian baru." confirmLabel="Terapkan" onConfirm={apply} />
    </section>
  );
}
