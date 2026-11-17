// Design pass screenshots (2026-11-17): one played season, then every page group at desktop and phone width into
// test-results/design-<group>-<page>-<SHOT>-<width>.png. SHOT=before|after (default "after"); GROUP limits to one group.
import { expect, test } from "@playwright/test";
import { closeHighlights } from "./highlights";

const GROUPS: Record<string, [string, string][]> = {
  home: [["home", "/"], ["dashboard", "/dashboard"]],
  competition: [["play", "/play"], ["d1", "/play/d1"], ["unzure", "/play/unzure"]],
  archive: [["seasons", "/wiki/seasons"], ["story", "/story"]],
  idols: [["database", "/wiki/idols"], ["profile", "profile"], ["groups", "/wiki/groups"], ["h2h", "/wiki/h2h"]],
  records: [["records", "/wiki/records"], ["career", "/wiki/career"], ["champions", "/wiki/champions"]],
  settings: [["settings", "/studio/settings"], ["ratings", "/studio/ratings"]],
};

test("design screenshots of every page group", async ({ page }) => {
  test.setTimeout(600_000);
  const shot = process.env.SHOT ?? "after";
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/matches played/).first()).toBeVisible({ timeout: 300_000 });
  await closeHighlights(page, true);
  for (const [group, pages] of Object.entries(GROUPS)) {
    if (process.env.GROUP && process.env.GROUP !== group) continue;
    for (const [name, path] of pages) {
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: width > 400 ? 900 : 812 });
        if (path === "profile") {
          await page.goto("/wiki/idols");
          await page.locator('a[href^="/wiki/idols/"]').first().click();
        } else await page.goto(path);
        await page.waitForTimeout(2500); // let the worker queries settle
        await page.screenshot({ path: `test-results/design-${group}-${name}-${shot}-${width}.png`, fullPage: true });
        const wide = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest("[class*=overflow-x]"))
          .slice(0, 3).map((e) => `${e.tagName}.${String(e.className).slice(0, 60)} → ${Math.round(e.getBoundingClientRect().right)}`));
        if (width < 400 && wide.length) console.log(`OVERFLOW ${group}/${name}:`, wide.join(" | ")); // the phone page must not scroll sideways
      }
    }
  }
});
