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
    await engine().updateSeason(season.id, { name: name.trim() || season.name, config });
    notify({ level: "success", message: "Pengaturan season disimpan" });
    await refreshSeason();
  };
  return (
    <section className={SECTION} aria-labelledby="set-season">
      <h2 id="set-season" className="m-0 font-display text-lg">Season</h2>
      <label className="block max-w-sm text-sm text-text-secondary">Nama season<input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={FIELD} /></label>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="text-left text-text-secondary"><th className="py-1 font-medium">Kompetisi</th><th className="py-1 font-medium">Best of N per stage</th></tr></thead>
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
                      <select disabled={!on} value={bestOfFor(config, c.key, stage)} className="rounded-control border border-border-strong bg-surface px-2 py-1 text-text-primary"
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
            {broken.map((b) => <li key={b.key}>{nameOf(b.key)} butuh {b.missing.map(nameOf).join(" dan ")}, yang sedang nonaktif.</li>)}
          </ul>
        )}
      </div>
      <Button variant="primary" onClick={save}>Simpan season</Button>
    </section>
  );
}
