// Design round 2 (2026-11-17): every page and popup in its filled states, desktop + phone, into
// test-results/r2-<SHOT>-<state>-<name>-<width>.png (SHOT=before|after, default after). Draft → season in progress →
// popups → finished season → an archive with two seasons. Slow on purpose (one long story through the app).
import { expect, test, type Page } from "@playwright/test";
import { closeHighlights } from "./highlights";

const SHOT = process.env.SHOT ?? "after";
const WIDTHS = [1280, 375];

async function settle(page: Page) {
  await page.waitForTimeout(1800); // worker queries + entrances
}
// A whole page at both widths (full height).
async function pageShot(page: Page, state: string, name: string, path?: string) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width > 400 ? 900 : 812 });
    if (path) await page.goto(path);
    await settle(page);
    await page.screenshot({ path: `test-results/r2-${SHOT}-${state}-${name}-${width}.png`, fullPage: true });
  }
}
// What is on screen now (a popup) at both widths, without navigating.
async function screenShot(page: Page, state: string, name: string) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width > 400 ? 900 : 812 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `test-results/r2-${SHOT}-${state}-${name}-${width}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}

test("design round 2: every page and popup, filled", async ({ page }) => {
  test.setTimeout(1_500_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });

  // 1. Draft: welcome, simulator before the start, studio pages, the replacement dialog.
  await pageShot(page, "draft", "home", "/");
  await pageShot(page, "draft", "play", "/play");
  await pageShot(page, "draft", "input", "/studio/input");
  await pageShot(page, "draft", "settings-leagues", "/studio/settings?s=leagues");
  await page.goto("/studio/inactive");
  const active = page.getByRole("region", { name: "Active", exact: true });
  await active.getByRole("searchbox").fill("Winter");
  await active.getByRole("checkbox", { name: "Select Winter" }).check();
  await active.getByRole("button", { name: "Deactivate (1)" }).click();
  await expect(page.getByRole("dialog", { name: "Pick roster replacements" })).toBeVisible();
  await screenShot(page, "draft", "dialog-replacement");
  await page.keyboard.press("Escape");
  await pageShot(page, "draft", "inactive", "/studio/inactive");

  // 2. The league phase as a live broadcast.
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await pageShot(page, "live", "play-start");
  await page.getByRole("button", { name: "To the next phase" }).click();
  const popup = page.getByRole("dialog", { name: "Simulation highlights" });
  await expect(popup).toBeVisible({ timeout: 150_000 });
  await page.waitForTimeout(2500);
  await screenShot(page, "live", "popup-broadcast");
  await popup.getByRole("button", { name: "Skip to the end" }).click();
  await screenShot(page, "live", "popup-broadcast-end");
  await popup.getByRole("button", { name: "Close" }).click();

  // 3. Season in progress (league done, cups to come).
  await pageShot(page, "live", "home", "/");
  await pageShot(page, "live", "dashboard", "/dashboard");
  await pageShot(page, "live", "play", "/play");
  await pageShot(page, "live", "d1", "/play/d1");
  await page.getByRole("tab", { name: "Fixtures" }).click().catch(() => null);
  await pageShot(page, "live", "d1-fixtures");
  await pageShot(page, "live", "the-idols", "/play/the-idols");
  await page.goto("/play/nugu");
  await page.getByRole("button", { name: /^Play .* vs / }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await screenShot(page, "live", "dialog-match");
  await page.getByRole("dialog").getByRole("button", { name: "Spin all" }).click().catch(() => null);
  await page.waitForTimeout(6000);
  await screenShot(page, "live", "dialog-match-spun");
  await page.keyboard.press("Escape");

  // 4. A cup as a news page.
  await page.goto("/play/unzure");
  await page.getByRole("button", { name: "Play to the end of Swiss" }).click();
  await expect(popup).toBeVisible({ timeout: 150_000 });
  await screenShot(page, "live", "popup-cup-news");
  await popup.getByRole("button", { name: "Close" }).click();
  await pageShot(page, "live", "unzure-swiss");

  // 5. The rest of the season: the season review, then every page finished.
  await page.goto("/play");
  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season complete!/)).toBeVisible({ timeout: 300_000 });
  await expect(popup).toBeVisible({ timeout: 60_000 });
  await screenShot(page, "done", "popup-season-review");
  await closeHighlights(page);
  const done: [string, string][] = [
    ["play", "/play"], ["home", "/"], ["dashboard", "/dashboard"], ["story", "/story"], ["d1", "/play/d1"], ["d2", "/play/d2"],
    ["the-idols", "/play/the-idols"], ["unzure", "/play/unzure"], ["inkigayo", "/play/inkigayo"], ["nugu", "/play/nugu"],
    ["b-side", "/play/b-side"], ["idols", "/wiki/idols"], ["groups", "/wiki/groups"], ["career", "/wiki/career"],
    ["records", "/wiki/records"], ["champions", "/wiki/champions"], ["matches", "/wiki/matches"], ["progression", "/wiki/progression"],
    ["seasons", "/wiki/seasons"], ["ratings", "/studio/ratings"], ["settings", "/studio/settings"],
  ];
  for (const [name, path] of done) await pageShot(page, "done", name, path);
  await page.goto("/play/unzure");
  for (const tab of ["Groups", "Knockout"]) {
    await page.getByRole("tab", { name: tab }).click();
    await pageShot(page, "done", `unzure-${tab.toLowerCase()}`);
  }
  await page.goto("/wiki/idols");
  await page.locator('a[href^="/wiki/idols/"]').first().click();
  await pageShot(page, "done", "profile");
  await page.goto("/wiki/groups");
  await page.locator('a[href^="/wiki/group/"]').first().click();
  await pageShot(page, "done", "group");
  await page.goto("/wiki/h2h");
  await page.locator('a[href*="/wiki/h2h?"]').first().click();
  await pageShot(page, "done", "h2h");
  await page.goto("/studio/settings?s=danger");
  await page.getByRole("button", { name: "Reset season…" }).click();
  await screenShot(page, "done", "dialog-confirm");
  await page.keyboard.press("Escape");

  // 6. Close the season (verdict, new season), play Season 2: the archive now holds two seasons.
  await page.goto("/play");
  await page.getByRole("button", { name: "Save ratings…" }).click();
  const verdict = page.getByRole("dialog", { name: "Season verdict" });
  await expect(verdict).toBeVisible();
  await screenShot(page, "done", "dialog-verdict");
  await verdict.getByRole("button", { name: "Save ratings" }).click();
  await page.getByRole("button", { name: "Start New Season" }).click();
  await screenShot(page, "done", "dialog-new-season");
  await page.getByRole("dialog").getByRole("button", { name: "Start New Season" }).click();
  await page.getByRole("button", { name: "Start Season 2" }).click();
  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season complete!/)).toBeVisible({ timeout: 300_000 });
  await closeHighlights(page, true);
  for (const [name, path] of [["seasons", "/wiki/seasons"], ["champions", "/wiki/champions"], ["records", "/wiki/records"], ["home", "/"], ["story", "/story"]] as const) {
    await pageShot(page, "two-seasons", name, path);
  }
});
