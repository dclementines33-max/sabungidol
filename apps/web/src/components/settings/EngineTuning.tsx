// Settings → Engine Tuning (PRD §5.1): the odds constant and the per-match variance σ, by preset
// or by hand, with the odds they give per rating gap and Best of N (before variance and form).
import type { SeasonRow } from "@sabung/db";
import { seriesOdds } from "@sabung/engine";
import { TUNING_LIMITS, TUNING_PRESETS, clampTuning, readSeasonConfig } from "@sabung/shared";
import { Button } from "@sabung/ui";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { SECTION, refreshSeason } from "./settingsShared";

const GAPS = [0, 5, 10, 20, 30];
const pct = (p: number) => `${Math.round(p * 100)}%`;

export function EngineTuning({ season }: { season: SeasonRow }) {
  const [tuning, setTuning] = useState(() => readSeasonConfig(season.config).tuning);
  const safe = clampTuning(tuning); // what is shown and saved
  const save = async () => {
    setTuning(safe); // a typed 100000 is saved as the top of the range, never as is (2026-11-16)
    await engine().updateSeason(season.id, { config: { ...readSeasonConfig(season.config), tuning: safe } });
    notify({ level: "success", message: "Engine Tuning saved" });
    await refreshSeason();
  };
  const field = (key: "scale" | "sigma", label: string, min: number, max: number) => (
    <label className="text-sm text-text-secondary">
      {label}
      <input type="number" min={min} max={max} value={tuning[key]} onChange={(e) => setTuning({ ...tuning, [key]: Number(e.target.value) })}
        className="mt-1 block w-28 rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-3 py-2 text-text-primary" />
    </label>
  );
  return (
    <section className={SECTION} aria-labelledby="set-engine">
      <h2 id="set-engine" className="m-0 font-display">Engine Tuning</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Preset">
        {Object.entries(TUNING_PRESETS).map(([name, preset]) => (
          <Button key={name} aria-pressed={tuning.scale === preset.scale && tuning.sigma === preset.sigma} className="px-3" onClick={() => setTuning({ ...preset })}>{name}</Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">{field("scale", "Odds constant (PRD: 40)", ...TUNING_LIMITS.scale)}{field("sigma", "Variance σ per match (PRD: 4)", ...TUNING_LIMITS.sigma)}</div>
      <div className="overflow-x-auto"><table className="board w-auto text-sm">
        <caption className="pb-2 text-left text-text-secondary">Favourite's win chance, before variance and form</caption>
        <thead><tr className="text-left text-text-secondary">{["Rating gap", "Per game", "Bo3", "Bo5", "Bo7", "Bo4 W/D/L"].map((h) => <th key={h} scope="col" className="px-3 py-1 font-medium">{h}</th>)}</tr></thead>
        <tbody>
          {GAPS.map((gap) => {
            const odds = (bestOf: 3 | 4 | 5 | 7) => seriesOdds(50 + gap, 50, bestOf, safe.scale);
            const bo4 = odds(4);
            return (
              <tr key={gap} className="border-t border-border font-mono">
                <td className="px-3 py-1">{gap}</td>
                <td className="px-3 py-1">{pct(1 / (1 + 10 ** (-gap / safe.scale)))}</td>
                <td className="px-3 py-1">{pct(odds(3).A)}</td>
                <td className="px-3 py-1">{pct(odds(5).A)}</td>
                <td className="px-3 py-1">{pct(odds(7).A)}</td>
                <td className="px-3 py-1">{`${Math.round(bo4.A * 100)}/${Math.round(bo4.D * 100)}/${Math.round(bo4.B * 100)}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      <Button variant="primary" onClick={save}>Save Engine Tuning</Button>
    </section>
  );
}
