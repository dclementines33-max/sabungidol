// Fase 5 gate, offline half (PRD §15): the production build, opened once online, then works fully
// offline with no login — a deep link loads from the service worker cache and the database answers.
import { expect, test } from "@playwright/test";

const PREVIEW = process.env.OFFLINE_URL ?? "http://localhost:5181"; // the built app with its service worker (playwright.config.ts), or a deployed URL

test("after one online visit the installed app opens and works offline", async ({ page, context }) => {
  test.setTimeout(240_000);
  await page.goto(PREVIEW);
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.evaluate(() => navigator.serviceWorker.ready); // everything precached
  expect(await page.evaluate(() => fetch("/manifest.webmanifest").then((r) => r.json()).then((m) => m.display))).toBe("standalone");

  await context.setOffline(true);
  await page.goto(`${PREVIEW}/wiki/idols`); // a page not visited yet, straight from the cache
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 60_000 });
  await expect(page.getByText(/of 242 idols$/)).toHaveText("242 of 242 idols", { timeout: 30_000 }); // the database answers offline
});
