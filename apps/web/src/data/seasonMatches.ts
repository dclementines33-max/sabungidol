// One season's saved matches, read once and kept (Fase 6 step 11): reading 5,583 rows takes ~150 ms and every panel
// replays the season from them, often several times per screen. A copy is reused while the season's fingerprint (match
// count + latest save) is unchanged. At most two seasons are kept (the live one and one being read back), so memory
// stays small. Callers must not mutate the array.
import { type Db, listSeasonMatches, seasonMatchStamp } from "@sabung/db";

const KEEP = 2;
const memo = new Map<string, { stamp: string; matches: ReturnType<typeof listSeasonMatches> }>();

export async function seasonMatches(db: Db, seasonId: string) {
  const stamp = await seasonMatchStamp(db, seasonId);
  let hit = memo.get(seasonId);
  if (hit?.stamp !== stamp) hit = { stamp, matches: listSeasonMatches(db, seasonId) };
  memo.delete(seasonId);
  memo.set(seasonId, hit); // most recently used last
  if (memo.size > KEEP) memo.delete(memo.keys().next().value!);
  return hit.matches;
}
