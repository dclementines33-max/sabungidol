// Creates Season 1 as a draft once there are idols and no season yet (Fase 2 plan step 4), with the
// leagues filled by the Data Maker rule. Runs in the Worker.
import { type Db, createDraftSeason, currentSeason, listIdols } from "@sabung/db";
import { splitLeagues } from "@sabung/engine";
import { ulid } from "@sabung/shared";

export type FirstSeason = { created: true; reserves: number } | { created: false; activeIdols: number } | null;

export async function ensureFirstSeason(db: Db): Promise<FirstSeason> {
  if (await currentSeason(db)) return null; // a season already exists
  const active = (await listIdols(db)).filter((i) => i.active);
  if (active.length < 240) return { created: false, activeIdols: active.length };
  const { leagues, reserves } = splitLeagues(active);
  await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: ulid(), leagues });
  return { created: true, reserves: reserves.length };
}
