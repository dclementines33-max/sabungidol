// Backup (PRD §12.3), reading: the rows of a section, in a fixed order so the same data always gives
// the same file (and checksum). Identity ids (rating_history) are left out: they are renumbered on
// import. stats_cache and event_log are never backed up (a cache, and this browser's own log).
import { asc, eq } from "drizzle-orm";
import type { Db } from "./openDb";
import { achievements, competitions, entries, groups, idols, matches, photos, placements, ratingHistory, seasons } from "./schema";

import type { BackupSection } from "@sabung/shared";
export type { BackupSection };
export type BackupTables = Record<string, Record<string, unknown>[]>;

// Parents before children: inserts go in this order, deletes in the reverse.
export const TABLE_ORDER = ["groups", "photos", "idols", "seasons", "competitions", "entries", "matches", "placements", "rating_history", "achievements"] as const;
export type TableName = (typeof TABLE_ORDER)[number];

export const SECTION_TABLES: Record<BackupSection, TableName[]> = {
  idols: ["groups", "photos", "idols"],
  roster: ["seasons", "competitions", "entries"],
  season: ["seasons", "competitions", "entries", "matches", "placements", "rating_history", "achievements"],
  rating: ["idols", "rating_history"],
  base: ["groups", "photos", "idols", "seasons", "competitions", "entries"], // one season: its branding + rosters, no matches
  full: [...TABLE_ORDER],
};


export async function readBackupTables(db: Db, section: BackupSection, seasonId?: string): Promise<BackupTables> {
  const one = (section === "season" || section === "base") && seasonId;
  const read: Record<TableName, () => Promise<Record<string, unknown>[]>> = {
    groups: () => db.select().from(groups).orderBy(asc(groups.id)),
    photos: () => db.select().from(photos).orderBy(asc(photos.id)),
    idols: () => db.select().from(idols).orderBy(asc(idols.id)),
    seasons: () => db.select().from(seasons).where(one ? eq(seasons.id, seasonId) : undefined).orderBy(asc(seasons.number)),
    competitions: () => db.select().from(competitions).where(one ? eq(competitions.seasonId, seasonId) : undefined).orderBy(asc(competitions.seasonId), asc(competitions.code)),
    entries: () => db.select().from(entries).where(one ? eq(entries.seasonId, seasonId) : undefined)
      .orderBy(asc(entries.seasonId), asc(entries.comp), asc(entries.stage), asc(entries.idolId)),
    matches: () => db.select().from(matches).where(one ? eq(matches.seasonId, seasonId) : undefined).orderBy(asc(matches.id)),
    placements: () => db.select().from(placements).where(one ? eq(placements.seasonId, seasonId) : undefined)
      .orderBy(asc(placements.seasonId), asc(placements.comp), asc(placements.idolId)),
    rating_history: async () => (await db.select().from(ratingHistory).where(one ? eq(ratingHistory.seasonId, seasonId) : undefined)
      .orderBy(asc(ratingHistory.at), asc(ratingHistory.id))).map(({ id: _id, ...row }) => row),
    achievements: () => db.select().from(achievements).where(one ? eq(achievements.seasonId, seasonId) : undefined)
      .orderBy(asc(achievements.seasonId), asc(achievements.idolId), asc(achievements.badge)),
  };
  // Who each idol id is (name + group), so another install can find its own ids for them.
  const tables: BackupTables = {
    idol_keys: await db.select({ id: idols.id, name: idols.name, groupName: groups.name }).from(idols).leftJoin(groups, eq(idols.groupId, groups.id)).orderBy(asc(idols.id)),
  };
  for (const name of SECTION_TABLES[section]) tables[name] = await read[name]();
  return tables;
}
