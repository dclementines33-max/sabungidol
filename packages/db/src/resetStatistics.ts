// "Reset statistik" (Update 4): every season, match, title, record and rating history goes; what stays is the setup —
// idols with their current ratings (user decision), groups, photos, settings, branding and league rosters — as Season 1 draft.
import { readBackupTables } from "./backupRead";
import { type SetupResult, applySetup } from "./backupSetup";
import type { Db } from "./openDb";
import { currentSeason } from "./seasons";

export async function resetStatistics(db: Db): Promise<SetupResult> {
  const season = await currentSeason(db);
  const setup = await readBackupTables(db, "base", season?.id); // the same "Data dasar" a backup would hold
  const same = new Map((setup.idols ?? []).map((i) => [i.id, i.id as string]));
  const result: SetupResult = { added: 0, replaced: 0, conflicts: [], unknown: [] };
  await db.transaction((tx) => applySetup(tx, setup, same, true, result));
  return result;
}
