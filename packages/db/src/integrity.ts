// Integrity check (PRD §14.2, §14.3), the database half: what is wrong, how bad, and whether one
// button can fix it safely. The Worker adds the photo files (OPFS). Runs at start-up and in Settings.
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { and, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import type { Db } from "./openDb";
import { entries, idols, matches, photos } from "./schema";
import { currentSeason, leagueRosters } from "./seasons";

export type IssueFix = "remove-orphan-matches" | "remove-missing-photos" | "remove-orphan-photo-files" | "inactive-manager" | "roster-settings";
export type Issue = { code: string; level: "error" | "warning"; message: string; count: number; fix?: IssueFix };

export async function checkIntegrity(db: Db): Promise<Issue[]> {
  const issues: Issue[] = [];
  const season = await currentSeason(db);
  if (season && season.status !== "completed" && season.status !== "archived") {
    const rosters = await leagueRosters(db, season.id);
    const wrong = [...D1_LEAGUES, ...D2_LEAGUES].filter((c) => (rosters[c]?.length ?? 0) !== 20);
    if (wrong.length) issues.push({ code: "E-INT-001", level: "error", count: wrong.length, fix: "roster-settings", message: `Liga tidak berisi tepat 20 idol: ${wrong.join(", ")}` });
    const inRoster = Object.values(rosters).flat();
    const inactive = inRoster.length ? await db.select({ name: idols.name }).from(idols).where(and(inArray(idols.id, inRoster), eq(idols.active, false))) : [];
    if (inactive.length) issues.push({ code: "E-INT-002", level: "error", count: inactive.length, fix: "inactive-manager", message: `Idol nonaktif di roster ${season.name}: ${inactive.map((i) => i.name).join(", ")}` });
  }
  // A league match between idols that are not both in that league's roster: an orphan.
  const [orphans] = await db.select({ n: sql<number>`count(*)::int` }).from(matches).where(and(eq(matches.stage, "LG"), sql`not exists (
    select 1 from ${entries} a join ${entries} b on a.season_id = b.season_id and a.comp = b.comp and a.stage = b.stage
    where a.season_id = ${matches.seasonId} and a.comp = ${matches.comp} and a.stage = 'LG' and a.idol_id = ${matches.idolA} and b.idol_id = ${matches.idolB})`));
  if (orphans!.n) issues.push({ code: "E-INT-003", level: "error", count: orphans!.n, fix: "remove-orphan-matches", message: `${orphans!.n} match liga antara idol yang tidak ada di roster liga itu` });
  const [noPhoto] = await db.select({ n: sql<number>`count(*)::int` }).from(idols).where(and(isNull(idols.photoId), eq(idols.active, true)));
  if (noPhoto!.n) issues.push({ code: "W-INT-004", level: "warning", count: noPhoto!.n, message: `${noPhoto!.n} idol aktif belum punya foto` });
  return issues;
}

// Photo records no idol uses (logos are kept: they are referenced from competitions.branding).
export async function unusedPhotoIds(db: Db): Promise<string[]> {
  const used = (await db.select({ id: idols.photoId, gallery: idols.gallery }).from(idols)).flatMap((r) => [...(r.id ? [r.id] : []), ...r.gallery]);
  const logos = (await db.execute(sql`select branding->>'logoId' as id from competitions where branding->>'logoId' is not null`)).rows.map((r) => (r as { id: string }).id);
  const keep = [...used, ...logos];
  return (await db.select({ id: photos.id }).from(photos).where(keep.length ? notInArray(photos.id, keep) : undefined)).map((r) => r.id);
}

export async function removeOrphanMatches(db: Db) {
  await db.execute(sql`delete from ${matches} where stage = 'LG' and not exists (
    select 1 from ${entries} a join ${entries} b on a.season_id = b.season_id and a.comp = b.comp and a.stage = b.stage
    where a.season_id = ${matches.seasonId} and a.comp = ${matches.comp} and a.stage = 'LG' and a.idol_id = ${matches.idolA} and b.idol_id = ${matches.idolB})`);
}
