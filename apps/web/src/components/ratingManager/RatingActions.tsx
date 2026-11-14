// Rating Manager action panel (PRD §6.4–6.6): each action fills the draft; nothing is saved here.
// Update 4: two editorial columns (presets / from the seasons played), each action with one line on what it does.
import type { IdolRow } from "@sabung/db";
import { Button } from "@sabung/ui";
import { type ReactNode, useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { realisticVariety, resetAll, seedPresets } from "./ratingPresets";

function Action({ note, children }: { note: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border py-2">
      <span className="text-sm text-text-secondary">{note}</span>
      <span className="flex items-center gap-2">{children}</span>
    </li>
  );
}

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
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <p className="kicker m-0 mb-1">Preset</p>
        <ul className="m-0 list-none p-0">
          <Action note="Rating dari seed tiap idol">
            <label className="flex items-center gap-1 text-xs text-text-secondary"><input type="checkbox" checked={jitter} onChange={(e) => setJitter(e.target.checked)} /> ± acak 3</label>
            <Button onClick={() => onChange(seedPresets(active, jitter), "Seed Presets")}>Apply Seed Presets</Button>
          </Action>
          <Action note="Sebaran rating yang terasa nyata"><Button onClick={() => onChange(realisticVariety(active), "Realistic Variety")}>Realistic Variety</Button></Action>
          <Action note="Semua idol aktif mulai sama"><Button onClick={() => onChange(resetAll(active), "Reset All to 75")}>Reset All to 75</Button></Action>
        </ul>
      </div>
      <div>
        <p className="kicker m-0 mb-1">Dari hasil season</p>
        <ul className="m-0 list-none p-0">
          <Action note="Naik/turun dari prestasi season terakhir">
            <Button disabled={busy} onClick={() => fromWorker(async () => (await engine().lastSeasonProgression()).proposals, "Season Progression", "Belum ada season yang selesai.")}>Apply Season Progression</Button>
          </Action>
          {(["replace", "blend"] as const).map((mode) => (
            <Action key={mode} note={mode === "replace" ? "Rating = performa karier" : "Setengah rating sekarang, setengah karier"}>
              <Button disabled={busy} onClick={() => fromWorker(() => engine().careerSync(Object.fromEntries(idols.map((i) => [i.id, i.rating])), mode), `Sync Career Stats (${mode})`, "Belum ada season yang selesai.")}>
                Sync from Career Stats · {mode === "replace" ? "Replace" : "Blend 50/50"}
              </Button>
            </Action>
          ))}
        </ul>
      </div>
    </div>
  );
}
