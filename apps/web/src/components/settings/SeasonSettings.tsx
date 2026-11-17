// Settings → Season (PRD §8): name, competitions on/off (with a warning for those that depend on
// one that is off), and Best of N per stage. Saved into the season's config.
import type { SeasonRow } from "@sabung/db";
import { ALWAYS_ON, BEST_OF_CHOICES, type BestOf, type SeasonConfig, SEASON_COMPETITIONS, STAGE_CODES, bestOfFor, brokenByOff, readSeasonConfig } from "@sabung/shared";
import { Button } from "@sabung/ui";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { FIELD, SECTION, refreshSeason } from "./settingsShared";

const nameOf = (key: string) => SEASON_COMPETITIONS.find((c) => c.key === key)!.name;

export function SeasonSettings({ season }: { season: SeasonRow }) {
  const [name, setName] = useState(season.name);
  const [config, setConfig] = useState<SeasonConfig>(() => readSeasonConfig(season.config));
  const broken = brokenByOff(config);
  const toggle = (key: string, on: boolean) => setConfig({ ...config, off: on ? config.off.filter((k) => k !== key) : [...config.off, key] });
  const save = async () => {
    // Only this section's fields, over the latest saved config (Engine Tuning saves into it too).
    await engine().updateSeason(season.id, { name: name.trim() || season.name, config: { ...readSeasonConfig(season.config), off: config.off, bestOf: config.bestOf } });
    notify({ level: "success", message: "Season settings saved" });
    await refreshSeason();
  };
  return (
    <section className={SECTION} aria-labelledby="set-season">
      <h2 id="set-season" className="m-0 font-display">Season</h2>
      <label className="block max-w-sm text-sm text-text-secondary">Season name<input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={FIELD} /></label>
      <table className="board text-sm">
        <thead><tr className="text-left text-text-secondary"><th className="py-1 font-medium">Competitions</th><th className="py-1 font-medium">Best of N per stage</th></tr></thead>
        <tbody>
          {SEASON_COMPETITIONS.map((c) => {
            const on = !config.off.includes(c.key);
            return (
              <tr key={c.key} className="border-t border-border align-top">
                <td className="py-2 pr-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={on} disabled={ALWAYS_ON.includes(c.key)} onChange={(e) => toggle(c.key, e.target.checked)} className="size-4 accent-accent-bright" />
                    {c.name}
                  </label>
                </td>
                <td className="flex flex-wrap gap-3 py-2">
                  {c.stages.map((stage) => (
                    <label key={stage} className="text-text-secondary">
                      {STAGE_CODES[stage]}{" "}
                      <select disabled={!on} value={bestOfFor(config, c.key, stage)} className="rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-2 py-1 text-text-primary"
                        onChange={(e) => setConfig({ ...config, bestOf: { ...config.bestOf, [`${c.key}:${stage}`]: Number(e.target.value) as BestOf } })}>
                        {BEST_OF_CHOICES.map((n) => <option key={n} value={n}>Bo{n}</option>)}
                      </select>
                    </label>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div role="status">
        {broken.length > 0 && (
          <ul className="m-0 list-none space-y-1 p-0 text-sm text-accent-bright">
            {broken.map((b) => <li key={b.key}>{nameOf(b.key)} needs {b.missing.map(nameOf).join(" and ")}, which is switched off.</li>)}
          </ul>
        )}
      </div>
      <Button variant="primary" onClick={save}>Save season</Button>
    </section>
  );
}
