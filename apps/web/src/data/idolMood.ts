// An idol's form (last 5 results) and morale right now (2026-11-17): from the current season's replay, so both read
// exactly as the engine will use them in her next match. Null before she has played this season.
import { type Db, currentSeason } from "@sabung/db";
import { type Result, getForm, moraleName, moraleTrack, runSeason } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

export async function moodOf(db: Db, idolId: string) {
  const season = await currentSeason(db);
  if (!season || season.status === "draft") return null;
  const input = await seasonInput(db, season);
  const played = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false }).matches.filter((m) => m.idolA === idolId || m.idolB === idolId);
  if (!played.length) return null;
  const results = played.map((m): Result => (m.result === "D" ? "D" : (m.result === "A") === (m.idolA === idolId) ? "W" : "L"));
  const morale = moraleTrack(played).get(idolId)!; // only her own matches move her morale
  return { form: getForm(results).name, morale: Math.round(morale * 10) / 10, moraleName: moraleName(morale), last: results.slice(-5) };
}
