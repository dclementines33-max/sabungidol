// Cloud sync, database side (2026-11-16, user decisions): photos and idol info go between a user's devices; stats,
// matches, ratings (except as a new idol's starting value), rosters and seasons never do; nothing is ever deleted by
// sync (a delete or a gallery removal stays on its device). Records are matched by a frozen sync key —
// lower(name)|lower(group) — so devices that started from the same seed or backup meet without duplicates, and a newer
// updatedAt wins. Photos travel as the SHA-256 of their original; the Worker turns a hash into a local photo id.
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { ulid } from "@sabung/shared";
import type { Db } from "./openDb";
import { competitions, groups, idols, photos } from "./schema";

export type SyncRow = { kind: "group" | "idol" | "gallery" | "photo" | "league"; key: string; data: Record<string, unknown>; updatedAt: string };
type Col = typeof idols.updatedAt | typeof groups.updatedAt | typeof photos.updatedAt | typeof competitions.updatedAt;
const iso = (col: Col) => sql<string>`to_char(${col} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`; // compares as text
const LEAGUE = /^D1[A-F]$/; // league branding lives on the D1 code (D2 and B-Side follow it)

// Gives every group and idol without one its sync key (kept through renames); the stamp is left as it was.
async function freezeKeys(db: Db) {
  const used = new Set((await db.select({ k: idols.syncKey }).from(idols)).map((r) => r.k));
  for (const g of await db.select({ id: groups.id, name: groups.name }).from(groups).where(isNull(groups.syncKey))) {
    await db.update(groups).set({ syncKey: g.name.toLowerCase(), updatedAt: sql`${groups.updatedAt}` }).where(eq(groups.id, g.id));
  }
  const rows = await db.select({ id: idols.id, name: idols.name, group: groups.name }).from(idols).leftJoin(groups, eq(idols.groupId, groups.id)).where(isNull(idols.syncKey));
  for (const i of rows) {
    let key = `${i.name.toLowerCase()}|${(i.group ?? "").toLowerCase()}`;
    if (used.has(key)) key = `${key}|${i.id}`; // a new idol with the name another one had before a rename
    used.add(key);
    await db.update(idols).set({ syncKey: key, updatedAt: sql`${idols.updatedAt}` }).where(eq(idols.id, i.id));
  }
}

// Everything changed after `since` (null = everything), as rows for the cloud. Photos without a hash are left out.
export async function localChanges(db: Db, since: string | null, seasonId: string | null): Promise<SyncRow[]> {
  await freezeKeys(db);
  const hashOf = new Map((await db.select({ id: photos.id, hash: photos.hash }).from(photos)).map((p) => [p.id, p.hash]));
  const hash = (id: string | null) => (id && hashOf.get(id)) || null;
  const out: SyncRow[] = [];
  const groupRows = await db.select({ key: groups.syncKey, name: groups.name, logoId: groups.logoId, at: iso(groups.updatedAt) }).from(groups).where(since ? gt(groups.updatedAt, since) : undefined);
  for (const g of groupRows) out.push({ kind: "group", key: g.key!, data: { name: g.name, logo: hash(g.logoId) }, updatedAt: g.at });
  const idolRows = await db.select({ key: idols.syncKey, name: idols.name, group: groups.syncKey, seed: idols.seed, nationality: idols.nationality, birthday: idols.birthday, role: idols.role, photoId: idols.photoId, gallery: idols.gallery, rating: idols.rating, at: iso(idols.updatedAt) })
    .from(idols).leftJoin(groups, eq(idols.groupId, groups.id)).where(since ? gt(idols.updatedAt, since) : undefined);
  for (const { key, photoId, gallery, at, ...i } of idolRows) {
    out.push({ kind: "idol", key: key!, data: { ...i, photo: hash(photoId) }, updatedAt: at });
    for (const h of gallery.map(hash)) if (h) out.push({ kind: "gallery", key: `${key}|${h}`, data: { idol: key, hash: h }, updatedAt: at });
  }
  for (const p of await db.select({ hash: photos.hash, focalX: photos.focalX, focalY: photos.focalY, at: iso(photos.updatedAt) }).from(photos).where(since ? gt(photos.updatedAt, since) : undefined)) {
    if (p.hash) out.push({ kind: "photo", key: p.hash, data: { focalX: p.focalX, focalY: p.focalY }, updatedAt: p.at });
  }
  if (seasonId) {
    for (const c of await db.select({ code: competitions.code, branding: competitions.branding, at: iso(competitions.updatedAt) }).from(competitions).where(and(eq(competitions.seasonId, seasonId), since ? gt(competitions.updatedAt, since) : undefined))) {
      const logo = hash((c.branding as { logoId?: string | null } | null)?.logoId ?? null);
      if (LEAGUE.test(c.code) && logo) out.push({ kind: "league", key: c.code, data: { logo }, updatedAt: c.at });
    }
  }
  return out;
}

export type ApplyHelpers = {
  photoId: (hash: string) => Promise<string>; // the local photo with this original (downloaded and stored when new)
  leagueName: (code: string) => string; // a league's default name, when the running season has no branding row yet
  seasonId: string | null; // the running season: league logos land there
};

// Merges cloud rows into this device: newer wins per record; a missing record is created (an idol with the cloud's
// rating as her start); a photo is only ever set, never cleared; gallery entries only add. Returns how many changed.
export async function applyRemote(db: Db, rows: SyncRow[], help: ApplyHelpers): Promise<number> {
  await freezeKeys(db); // local records get their keys first, so cloud rows find them
  const order = ["group", "idol", "gallery", "photo", "league"];
  let changed = 0;
  for (const r of [...rows].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))) {
    try {
      if (await applyOne(db, r, help)) changed++;
    } catch (error) {
      console.warn(`Sync: ${r.kind} ${r.key} not applied`, error); // e.g. a name another idol already has here; the rest goes on
    }
  }
  return changed;
}

async function applyOne(db: Db, r: SyncRow, help: ApplyHelpers): Promise<boolean> {
  const d = r.data;
  const photo = async (h: unknown) => (typeof h === "string" && h ? help.photoId(h) : undefined);
  if (r.kind === "group") {
    const name = String(d.name);
    const [g] = await db.select({ id: groups.id, at: iso(groups.updatedAt) }).from(groups).where(sql`${groups.syncKey} = ${r.key} or (${groups.syncKey} is null and lower(${groups.name}) = ${name.toLowerCase()})`).limit(1);
    const logoId = await photo(d.logo);
    if (!g) {
      await db.insert(groups).values({ id: ulid(), name, logoId: logoId ?? null, syncKey: r.key, updatedAt: r.updatedAt });
      return true;
    }
    if (g.at >= r.updatedAt) return false;
    await db.update(groups).set({ name, syncKey: r.key, updatedAt: r.updatedAt, ...(logoId ? { logoId } : {}) }).where(eq(groups.id, g.id));
    return true;
  }
  if (r.kind === "idol") {
    const name = String(d.name);
    const [group] = d.group ? await db.select({ id: groups.id }).from(groups).where(eq(groups.syncKey, String(d.group))) : [];
    const groupId = group?.id ?? null;
    const [i] = await db.select({ id: idols.id, at: iso(idols.updatedAt) }).from(idols)
      .where(sql`${idols.syncKey} = ${r.key} or (${idols.syncKey} is null and lower(${idols.name}) = ${name.toLowerCase()} and coalesce(${idols.groupId}, '') = ${groupId ?? ""})`).limit(1);
    const photoId = await photo(d.photo);
    const info = { name, groupId, seed: (d.seed as number | null) ?? null, nationality: (d.nationality as string | null) ?? null, birthday: (d.birthday as string | null) ?? null, role: (d.role as string | null) ?? null };
    if (!i) {
      await db.insert(idols).values({ id: ulid(), ...info, photoId: photoId ?? null, rating: typeof d.rating === "number" ? d.rating : 75, syncKey: r.key, updatedAt: r.updatedAt });
      return true;
    }
    if (i.at >= r.updatedAt) return false;
    await db.update(idols).set({ ...info, syncKey: r.key, updatedAt: r.updatedAt, ...(photoId ? { photoId } : {}) }).where(eq(idols.id, i.id)); // rating and active stay this device's
    return true;
  }
  if (r.kind === "gallery") {
    const [i] = await db.select({ id: idols.id, gallery: idols.gallery, photoId: idols.photoId }).from(idols).where(eq(idols.syncKey, String(d.idol)));
    if (!i) return false;
    const id = await help.photoId(String(d.hash));
    if (i.gallery.includes(id) || i.photoId === id) return false;
    await db.update(idols).set({ gallery: [...i.gallery, id], updatedAt: sql`${idols.updatedAt}` }).where(eq(idols.id, i.id)); // not a local edit: no new stamp
    return true;
  }
  if (r.kind === "photo") {
    const [p] = await db.select({ id: photos.id, at: iso(photos.updatedAt) }).from(photos).where(eq(photos.hash, r.key));
    if (!p || p.at >= r.updatedAt) return false;
    await db.update(photos).set({ focalX: Number(d.focalX), focalY: Number(d.focalY), updatedAt: r.updatedAt }).where(eq(photos.id, p.id));
    return true;
  }
  if (r.kind === "league" && help.seasonId && LEAGUE.test(r.key)) {
    const [c] = await db.select({ name: competitions.name, branding: competitions.branding, at: iso(competitions.updatedAt) }).from(competitions).where(and(eq(competitions.seasonId, help.seasonId), eq(competitions.code, r.key)));
    if (c && c.at >= r.updatedAt) return false;
    const logoId = await help.photoId(String(d.logo));
    const branding = { ...((c?.branding as object | null) ?? {}), logoId };
    await db.insert(competitions).values({ seasonId: help.seasonId, code: r.key, name: c?.name ?? help.leagueName(r.key), branding, updatedAt: r.updatedAt })
      .onConflictDoUpdate({ target: [competitions.seasonId, competitions.code], set: { branding, updatedAt: r.updatedAt } });
    return true;
  }
  return false;
}

// Photos stored before sync existed have no hash yet: the Worker reads their originals and fills it in once.
export const photosWithoutHash = (db: Db) => db.select({ id: photos.id, sizes: photos.sizes }).from(photos).where(isNull(photos.hash));
export const setPhotoHash = (db: Db, id: string, hash: string) => db.update(photos).set({ hash }).where(eq(photos.id, id));
export const photoByHash = async (db: Db, hash: string) => (await db.select({ id: photos.id }).from(photos).where(eq(photos.hash, hash)).limit(1))[0]?.id ?? null;
