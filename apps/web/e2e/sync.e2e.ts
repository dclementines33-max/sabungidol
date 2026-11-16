// Cloud sync between two devices (2026-11-16): two browser profiles, one account. The real API code (apps/api handle,
// on PGlite with in-memory Storage) runs inside this test and answers both profiles' /api calls, so the whole path —
// Worker push, API, pull, merge — is exercised without Supabase. Device A changes an idol's details, gives her a new
// photo and swaps two league places; fresh device B gets the details and the photo, keeps its own rating for her, and
// builds its first rosters from A's.
import { type BrowserContext, type Page, expect, test } from "@playwright/test";
import { memoryCloud } from "../../api/src/memoryCloud";

// Every /api call of a profile goes to the in-memory API, signed in as its one user.
async function cloud() {
  const api = await memoryCloud();
  const connect = (context: BrowserContext) => context.route("**/api/**", async (route) => {
    const r = route.request();
    const url = new URL(r.url());
    const body = r.method() === "GET" ? undefined : r.postDataBuffer() ?? undefined;
    const answer = await api.call(url.pathname + url.search, { method: r.method(), headers: await r.allHeaders(), body: body && new Uint8Array(body) });
    await route.fulfill({ status: answer.status, headers: Object.fromEntries(answer.headers), body: Buffer.from(await answer.arrayBuffer()) });
  });
  return { connect };
}

type Engine = Record<string, (...args: unknown[]) => Promise<unknown>>;
const engine = (page: Page, script: string, arg?: unknown) => page.evaluate(async ([s, a]) => {
  const e = (await import("/src/data/engineClient.ts" as string)).engine() as Engine;
  return new Function("e", "a", `return (async () => { ${s} })()`)(e, a);
}, [script, arg] as const);

const open = async (page: Page) => {
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
};

test("photos, idol info and first rosters travel between two devices; an existing rating stays", async ({ browser }) => {
  test.setTimeout(400_000);
  const { connect } = await cloud();
  const deviceA = await browser.newContext();
  const deviceB = await browser.newContext();
  await connect(deviceA);
  await connect(deviceB);

  const a = await deviceA.newPage();
  await open(a);
  const setup = (await engine(a, `
    const idols = await e.listIdols();
    const liz = idols.find((i) => i.name === "Liz");
    const season = await e.currentSeason();
    const rosters = await e.leagueRosters(season.id);
    const [x] = rosters.D1A, [y] = rosters.D1B; // swap two league places
    await e.setLeagueRosters(season.id, { D1A: [y, ...rosters.D1A.slice(1)], D1B: [x, ...rosters.D1B.slice(1)] });
    await e.updateIdol(liz.id, { name: liz.name, groupName: liz.groupName, rating: 41, seed: liz.seed, nationality: liz.nationality, birthday: liz.birthday, role: "Synced Role", photoId: liz.photoId });
    const canvas = new OffscreenCanvas(40, 40); const ctx = canvas.getContext("2d"); ctx.fillStyle = "#c33"; ctx.fillRect(0, 0, 40, 40);
    await e.replacePhoto(liz.id, await canvas.convertToBlob({ type: "image/png" }));
    await e.cloudSync(); await e.cloudSync(); // the second one surely starts after these edits
    return { swapped: [idols.find((i) => i.id === y).name, idols.find((i) => i.id === x).name] };
  `)) as { swapped: [string, string] };

  const b = await deviceB.newPage();
  await open(b);
  const onB = (await engine(b, `
    await e.cloudSync(); await e.cloudSync();
    const idols = await e.listIdols();
    const liz = idols.find((i) => i.name === "Liz");
    const season = await e.currentSeason();
    const rosters = await e.leagueRosters(season.id);
    const name = (id) => idols.find((i) => i.id === id).name;
    const photo = liz.photoId ? await e.photoBlob(liz.photoId, 64) : null;
    return { role: liz.role, rating: liz.rating, photoType: photo && photo.type, firsts: [name(rosters.D1A[0]), name(rosters.D1B[0])], count: idols.length };
  `)) as { role: string; rating: number; photoType: string | null; firsts: [string, string]; count: number };

  expect(onB.role).toBe("Synced Role");
  expect(onB.rating).not.toBe(41); // B had Liz already: her rating stays B's own
  expect(onB.photoType).toBeTruthy(); // the new photo came down and was stored
  expect(onB.firsts).toEqual(setup.swapped); // a fresh device's first rosters are A's
  await deviceA.close();
  await deviceB.close();
});
