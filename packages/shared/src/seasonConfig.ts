// Season settings (PRD §4, §8 Settings, §12.1 seasons.config): which competitions run and the Best
// of N per stage. The 9 competitions as Settings shows them; leagues cannot be switched off,
// everything else depends on them. Switching one off warns about those that depend on it.
import { z } from "zod";
import { type BestOf, defaultBestOf } from "./bestOf";
import { B_SIDE_CUPS, type CompetitionCode, D1_LEAGUES, D2_LEAGUES } from "./competitions";
import type { StageCode } from "./stages";

export type CompetitionKey = "D1" | "D2" | "IDL" | "SWS" | "LCQ" | "UZC" | "INK" | "NUG" | "BS" | "DSG" | "MBK";
export const SEASON_COMPETITIONS: { key: CompetitionKey; name: string; codes: CompetitionCode[]; stages: StageCode[]; needs: CompetitionKey[] }[] = [
  { key: "D1", name: "Liga Divisi 1", codes: [...D1_LEAGUES], stages: ["LG"], needs: [] },
  { key: "D2", name: "Liga Divisi 2", codes: [...D2_LEAGUES], stages: ["LG"], needs: [] },
  { key: "IDL", name: "The Idols", codes: ["IDL"], stages: ["LG", "UB", "LB", "FN"], needs: [] },
  { key: "SWS", name: "Swiss Play-in", codes: ["SWS"], stages: ["SW"], needs: ["D1"] },
  { key: "LCQ", name: "Last Chance Qualifier", codes: ["LCQ"], stages: ["LQ"], needs: ["SWS"] },
  { key: "UZC", name: "Unzure Cup", codes: ["UZC"], stages: ["GS", "KO", "FN"], needs: ["D1", "SWS", "LCQ"] },
  { key: "INK", name: "Inkigayo Cup", codes: ["INK"], stages: ["UB", "LB", "FN"], needs: ["D1"] },
  { key: "NUG", name: "Nugu Cup", codes: ["NUG"], stages: ["KO", "FN"], needs: ["D1", "D2"] },
  { key: "BS", name: "B-Side Cup", codes: [...B_SIDE_CUPS], stages: ["KO", "FN"], needs: ["D1"] },
  { key: "DSG", name: "Daesang Cup", codes: ["DSG"], stages: ["FN"], needs: ["IDL", "UZC"] },
  { key: "MBK", name: "Music Bank Cup", codes: ["MBK"], stages: ["FN"], needs: ["D1", "BS"] },
];
export const ALWAYS_ON: CompetitionKey[] = ["D1", "D2"];
export const BEST_OF_CHOICES: BestOf[] = [3, 4, 5, 7];

const bestOf = z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(7)]);
export const seasonConfigSchema = z.object({
  off: z.array(z.string()).default([]), // competition keys switched off
  bestOf: z.record(z.string(), bestOf).default({}), // "KEY:STAGE" → BoN, only where it differs from the default
  tuning: z.object({ scale: z.number().min(10).max(100), sigma: z.number().min(0).max(15) }).default({ scale: 40, sigma: 4 }), // PRD §5.1
});
export type SeasonConfig = z.infer<typeof seasonConfigSchema>;
export const readSeasonConfig = (raw: unknown): SeasonConfig => seasonConfigSchema.parse(raw ?? {});

// The BoN a stage plays with: the season's choice, else the PRD default.
export function bestOfFor(config: SeasonConfig, key: CompetitionKey, stage: StageCode): BestOf {
  const comp = SEASON_COMPETITIONS.find((c) => c.key === key)!;
  return (config.bestOf[`${key}:${stage}`] as BestOf | undefined) ?? defaultBestOf(comp.codes[0]!, stage);
}

// Competitions that still run but need one that is off: what Settings warns about.
export function brokenByOff(config: SeasonConfig): { key: CompetitionKey; missing: CompetitionKey[] }[] {
  const off = new Set(config.off);
  return SEASON_COMPETITIONS.filter((c) => !off.has(c.key))
    .map((c) => ({ key: c.key, missing: c.needs.filter((n) => off.has(n)) }))
    .filter((c) => c.missing.length > 0);
}

// Engine Tuning presets (PRD §5.1 names them; the numbers are ours: Realistic = the PRD default).
export const TUNING_PRESETS = {
  Realistic: { scale: 40, sigma: 4 },
  Chaotic: { scale: 60, sigma: 8 }, // flatter odds, bigger off-days: more upsets
  Dominant: { scale: 28, sigma: 2 }, // steeper odds, steadier: favourites win more
} as const;
