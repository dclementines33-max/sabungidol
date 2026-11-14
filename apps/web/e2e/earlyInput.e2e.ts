// Fase 3 step 9: a click or Ctrl+K before React has taken over the page is not lost. The app's
// scripts are held back so the input surely lands before hydration.
import { expect, type Page, test } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

async function openBeforeHydration(page: Page) {
  await page.route(/\.(js|tsx?)(\?.*)?$/, async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
  await page.goto("/wiki/career", { waitUntil: "domcontentloaded" });
  const play = page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Play" });
  await play.waitFor();
  expect(await page.evaluate(() => document.documentElement.dataset.hydrated)).toBeUndefined(); // React not there yet
  return play;
}

test("an early click is replayed after hydration", async ({ page }) => {
  await (await openBeforeHydration(page)).click();
  await expect(page.getByRole("dialog", { name: "Play" })).toBeVisible({ timeout: 60_000 });
});

test("an early Ctrl+K opens the command palette after hydration", async ({ page }) => {
  await openBeforeHydration(page);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search panels or commands" })).toBeVisible({ timeout: 60_000 });
});
