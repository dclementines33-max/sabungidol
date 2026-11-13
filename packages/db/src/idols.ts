// Idols (PRD §3, §8): list, add in batches, change, activate, delete. Every rule from
// shared/idolRules is applied here too, so no screen can save a duplicate.
import { type IdolInput, idolInputSchema, judgeBatch, judgeIdol, ulid } from "@sabung/shared";
import { asc, eq, inArray, or, sql } from "drizzle-orm";
import { ensureGroups } from "./groups";
import type { Db, Tx } from "./openDb";
import { entries, groups, idols, matches, photos, seasons } from "./schema";

export type IdolRow = {
  id: string; name: string; groupId: string | null; groupName: string | null; rating: number;
  seed: number | null; nationality: string | null; birthday: string | null; photoId: string | null; active: boolean;
  focalX?: number | null; focalY?: number | null; // the photo's focal point (PRD §10.3), null = centre
};

export async function listIdols(db: Db | Tx): Promise<IdolRow[]> {
  return db.select({
    id: idols.id, name: idols.name, groupId: idols.groupId, groupName: groups.name, rating: idols.rating,
    seed: idols.seed, nationality: idols.nationality, birthday: idols.birthday, photoId: idols.photoId, active: idols.active,
    focalX: photos.focalX, focalY: photos.focalY,
  }).from(idols).leftJoin(groups, eq(idols.groupId, groups.id)).leftJoin(photos, eq(idols.photoId, photos.id)).orderBy(asc(sql`lower(${idols.name})`));
}

// Adds a batch in one transaction (inside a caller's transaction it becomes a savepoint).
// Exact duplicates are refused and reported; everything else is saved.
export async function addIdols(db: Db | Tx, batch: (IdolInput & { photoId?: string | null })[]) {
  const valid = batch.map((input) => ({ ...idolInputSchema.parse(input), photoId: input.photoId ?? null }));
  return db.transaction(async (tx) => {
    const existing = (await listIdols(tx)).map((i) => ({ name: i.name, groupName: i.groupName }));
    const verdicts = judgeBatch(valid, existing);
    const keep = valid.filter((_, i) => verdicts[i].status !== "duplicate");
    const groupIds = await ensureGroups(tx, keep.flatMap((i) => (i.groupName ? [i.groupName] : [])));
    const rows = keep.map((i) => ({
      id: ulid(), name: i.name, groupId: i.groupName ? groupIds.get(i.groupName.toLowerCase())! : null, rating: i.rating,
      seed: i.seed, nationality: i.nationality, birthday: i.birthday, photoId: i.photoId, active: true,
    }));
    for (let i = 0; i < rows.length; i += 500) await tx.insert(idols).values(rows.slice(i, i + 500));
    return {
      added: rows.map((r) => r.id),
      refused: valid.flatMap((i, n) => (verdicts[n].status === "duplicate" ? [{ name: i.name, reason: verdicts[n].reasons[0] }] : [])),
    };
  });
}

// Changes one idol; refused if it would become an exact duplicate of another idol.
export async function updateIdol(db: Db, id: string, input: IdolInput & { photoId?: string | null }) {
  const value = idolInputSchema.parse(input);
  const others = (await listIdols(db)).filter((i) => i.id !== id).map((i) => ({ name: i.name, groupName: i.groupName }));
  const verdict = judgeIdol(value, others);
  if (verdict.status === "duplicate") return { ok: false as const, reason: verdict.reasons[0] };
  const groupId = value.groupName ? (await ensureGroups(db, [value.groupName])).get(value.groupName.toLowerCase())! : null;
  await db.update(idols).set({
    name: value.name, groupId, rating: value.rating, seed: value.seed, nationality: value.nationality, birthday: value.birthday,
    ...(input.photoId !== undefined ? { photoId: input.photoId } : {}), // leave the photo alone unless given
  }).where(eq(idols.id, id));
  return { ok: true as const };
}

export async function setActive(db: Db | Tx, ids: string[], active: boolean) {
  if (ids.length > 0) await db.update(idols).set({ active }).where(inArray(idols.id, ids));
}

// An idol with matches is part of history and cannot be deleted (deactivate it instead); one in a
// league roster cannot either, so no league loses a place (user decision 2026-11-13).
export async function deleteBlocker(db: Db | Tx, id: string): Promise<{ matches: number; roster?: string } | null> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(matches).where(or(eq(matches.idolA, id), eq(matches.idolB, id)));
  if (n > 0) return { matches: n };
  const [entry] = await db.select({ comp: entries.comp, season: seasons.name }).from(entries)
    .innerJoin(seasons, eq(entries.seasonId, seasons.id)).where(eq(entries.idolId, id)).limit(1);
  return entry ? { matches: 0, roster: `${entry.comp} ${entry.season}` } : null;
}

export async function deleteIdol(db: Db, id: string): Promise<{ deleted: boolean; matches: number; roster?: string }> {
  const blocker = await deleteBlocker(db, id);
  if (blocker) return { deleted: false, ...blocker };
  await db.delete(idols).where(eq(idols.id, id));
  return { deleted: true, matches: 0 };
}

// Gives an idol a new photo; returns the photo it had before (null if none), for clean-up.
export async function setIdolPhoto(db: Db, id: string, photoId: string): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select({ photoId: idols.photoId }).from(idols).where(eq(idols.id, id));
    if (!row) throw new Error(`Idol ${id} tidak ditemukan`);
    await tx.update(idols).set({ photoId }).where(eq(idols.id, id));
    return row.photoId;
  });
}
