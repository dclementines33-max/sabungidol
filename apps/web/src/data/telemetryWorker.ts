// Season telemetry in the Worker (2026-11-17): the current season replayed from its saved matches, every idol's games won
// against what her rating expected (engine seasonTelemetry), with the season's own tuning scale.
import { type Db, currentSeason } from "@sabung/db";
import { runSeason, seasonTelemetry } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

export async function telemetryOf(db: Db) {
  const season = await currentSeason(db);
  if (!season || season.status === "draft") return [];
  const input = await seasonInput(db, season);
  const { matches } = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
  return seasonTelemetry(matches, input.tuning?.scale ?? 40);
}
