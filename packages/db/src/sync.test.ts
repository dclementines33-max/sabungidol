import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { setGallery } from "./gallery";
import { addIdols, deleteIdol, listIdols, updateIdol } from "./idols";
import { openDb } from "./openDb";
import { insertPhoto } from "./photos";
import { idols } from "./schema";
import { createDraftSeason, leagueRosters } from "./seasons";
import { type SyncRow, applyFirstRosters, applyRemote, localChanges, rosterRows } from "./sync";

const idol = (name: string, rating = 80) => ({ name, groupName: "IVE", rating, seed: null, nationality: null, birthday: null });
// The cloud in a few lines, as the API keeps it: newer updatedAt wins, gallery entries only add.
function cloud() {
  const rows = new Map<string, SyncRow>();
  const push = (list: SyncRow[]) => list.forEach((r) => {
    const old = rows.get(`${r.kind}|${r.key}`);
    if (!old || (r.kind !== "gallery" && old.updatedAt < r.updatedAt)) rows.set(`${r.kind}|${r.key}`, r);
  });
  return { push, all: () => [...rows.values()] };
}
// A device's photos: hash = its photo id here, so photoId() can find or "download" one.
const helpers = (db: Awaited<ReturnType<typeof openDb>>) => ({
  seasonId: null, leagueName: (c: string) => c,
  photoId: async (hash: string) => {
    const [p] = await db.execute<{ id: string }>(`select id from photos where hash = '${hash}'`).then((r) => r.rows);
    if (p) return p.id;
    await insertPhoto(db, { id: `local-${hash}`, sizes: {}, bytes: 1, hash });
    return `local-${hash}`;
  },
});
const later = () => new Promise((r) => setTimeout(r, 5));

describe("cloud sync merge", () => {
  it("two devices from the same seed meet without duplicates; info and photos travel, ratings and deletes don't", async () => {
    const a = await openDb();
    const b = await openDb();
    const c = cloud();
    await addIdols(a, [idol("Liz"), idol("Rei")]);
    await addIdols(b, [idol("Liz", 90), idol("Rei")]); // same seed, other ids, B's own rating for Liz
    c.push(await localChanges(a, null, null));
    expect(await applyRemote(b, c.all(), helpers(b))).toBe(0); // same base: nothing new for B
    expect((await listIdols(b)).length).toBe(2);

    await later();
    const liz = (await listIdols(a)).find((i) => i.name === "Liz")!;
    await insertPhoto(a, { id: "p1", sizes: {}, bytes: 1, hash: "h1" });
    await updateIdol(a, liz.id, { ...idol("Liz", 60), role: "Main Vocalist", photoId: "p1" });
    await setGallery(a, liz.id, ["p1"]);
    await addIdols(a, [idol("Gaeul", 77)]);
    await deleteIdol(a, (await listIdols(a)).find((i) => i.name === "Rei")!.id);
    c.push(await localChanges(a, null, null));

    await applyRemote(b, c.all(), helpers(b));
    const onB = await listIdols(b);
    const lizB = onB.find((i) => i.name === "Liz")!;
    expect(lizB.role).toBe("Main Vocalist");
    expect(lizB.rating).toBe(90); // a rating never overwrites an existing idol
    expect(lizB.photoId).toBe("local-h1");
    expect(onB.find((i) => i.name === "Gaeul")?.rating).toBe(77); // a new idol starts with the cloud's rating
    expect(onB.some((i) => i.name === "Rei")).toBe(true); // A's delete stays on A
  });

  it("an older change loses, a photo is never cleared, and a gallery removal stays local", async () => {
    const a = await openDb();
    const c = cloud();
    await addIdols(a, [idol("Liz")]);
    await insertPhoto(a, { id: "p1", sizes: {}, bytes: 1, hash: "h1" });
    const id = (await listIdols(a))[0]!.id;
    await updateIdol(a, id, { ...idol("Liz"), photoId: "p1", role: "Leader" });
    await setGallery(a, id, ["p1"]);
    const key = (await localChanges(a, null, null)).find((r) => r.kind === "idol")!.key;
    c.push([{ kind: "idol", key, data: { name: "Liz", group: "ive", role: "Old", photo: null }, updatedAt: "2000-01-01T00:00:00.000Z" }]);
    c.push([{ kind: "gallery", key: `${key}|h1`, data: { idol: key, hash: "h1" }, updatedAt: "2000-01-01T00:00:00.000Z" }]);
    await applyRemote(a, c.all(), helpers(a));
    expect((await listIdols(a))[0]).toMatchObject({ role: "Leader", photoId: "p1" });

    await setGallery(a, id, []); // removed here
    const stamp = (await a.select({ at: idols.updatedAt }).from(idols).where(eq(idols.id, id)))[0]!.at;
    c.push([{ kind: "idol", key, data: { name: "Liz", group: "ive", role: "Leader", photo: null }, updatedAt: "2999-01-01T00:00:00.000Z" }]);
    await applyRemote(a, c.all().filter((r) => r.kind === "idol"), helpers(a)); // a newer record without a photo
    expect((await listIdols(a))[0]).toMatchObject({ photoId: "p1", gallery: [] });
    expect(stamp).toBeTruthy();
  });

  it("rosters are a starting value: only a fresh device builds its first season from the cloud's, once", async () => {
    const a = await openDb();
    const b = await openDb();
    await addIdols(a, [idol("Liz"), idol("Rei"), idol("Gaeul"), idol("Leeseo")]);
    await addIdols(b, [idol("Liz"), idol("Rei"), idol("Gaeul"), idol("Leeseo")]);
    const id = async (db: typeof a, name: string) => (await listIdols(db)).find((i) => i.name === name)!.id;
    await createDraftSeason(a, { id: "S01", number: 1, name: "Season 1", seed: "x", leagues: { D1A: [await id(a, "Liz"), await id(a, "Rei")], D1B: [await id(a, "Gaeul"), await id(a, "Leeseo")] } });
    await createDraftSeason(b, { id: "S01", number: 1, name: "Season 1", seed: "y", leagues: { D1A: [await id(b, "Liz"), await id(b, "Gaeul")], D1B: [await id(b, "Rei"), await id(b, "Leeseo")] } });
    const rows = await rosterRows(a, "S01", "2026-11-16T10:00:00.000Z");
    expect(rows.find((r) => r.key === "D1A")!.data.idols).toEqual(["liz|ive", "rei|ive"]);

    expect(await applyFirstRosters(b, rows)).toBe(true);
    expect((await leagueRosters(b, "S01")).D1A).toEqual([await id(b, "Liz"), await id(b, "Rei")]);
    expect(await applyFirstRosters(b, [{ ...rows[0]!, data: { idols: ["liz|ive", "nobody|x"] } }])).toBe(false); // unknown idol: keep own
  });
});
