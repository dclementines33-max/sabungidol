// Rating Manager action panel (PRD §6.4–6.6): each action fills the draft; nothing is saved here.
import type { IdolRow } from "@sabung/db";
import { Button } from "@sabung/ui";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { realisticVariety, resetAll, seedPresets } from "./ratingPresets";

export function RatingActions({ idols, onChange }: { idols: IdolRow[]; onChange: (changes: Map<string, number>, label: string) => void }) {
  const [jitter, setJitter] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = idols.filter((i) => i.active);
  const fromWorker = async (job: () => Promise<{ idolId: string; new: number }[]>, label: string, empty: string) => {
    setBusy(true);
    try {
      const rows = await job();
      if (rows.length) onChange(new Map(rows.map((r) => [r.idolId, r.new])), label);
      else notify({ level: "info", message: empty });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => onChange(seedPresets(active, jitter), "Seed Presets")}>Apply Seed Presets</Button>
        <label className="flex items-center gap-1 text-sm text-text-secondary"><input type="checkbox" checked={jitter} onChange={(e) => setJitter(e.target.checked)} /> ± acak 3</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onChange(realisticVariety(active), "Realistic Variety")}>Realistic Variety</Button>
        <Button onClick={() => onChange(resetAll(active), "Reset All to 75")}>Reset All to 75</Button>
        <Button disabled={busy} onClick={() => fromWorker(async () => (await engine().lastSeasonProgression()).proposals, "Season Progression", "Belum ada season yang selesai.")}>Apply Season Progression</Button>
        {(["replace", "blend"] as const).map((mode) => (
          <Button key={mode} disabled={busy} onClick={() => fromWorker(() => engine().careerSync(Object.fromEntries(idols.map((i) => [i.id, i.rating])), mode), `Sync Career Stats (${mode})`, "Belum ada season yang selesai.")}>
            Sync from Career Stats · {mode === "replace" ? "Replace" : "Blend 50/50"}
          </Button>
        ))}
      </div>
    </div>
  );
}
