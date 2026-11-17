// Ranking + Tier List (2026-11-17): the Sabung Index podium for idols and girl groups, My Top 10 (fill, reorder, kept
// after a reload), a tier list made from a preset, filled by rating, by dragging and by tap-to-place. Screenshots in
// test-results/ranking-*.png and tiers-*.png for a human look.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ready = async (page: import("@playwright/test").Page, path: string) => {
  await page.goto(path);
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
};

test("ranking: index podium, girl groups, My Top 10", async ({ page }) => {
  test.setTimeout(240_000);
  await ready(page, "/wiki/ranking");
  await expect(page.getByRole("listitem", { name: /^Place 1:/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("ol[start='4'] > li")).toHaveCount(7);
  await page.waitForTimeout(1200); // podium rise
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/ranking-index.png", fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);

  await page.getByRole("button", { name: "Girl groups" }).click();
  await expect(page.getByText("Top three girl groups · Sabung Index")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/ranking-groups.png", fullPage: true });

  await page.getByRole("button", { name: "Idols" }).click();
  await page.getByRole("tab", { name: "My Top 10" }).click();
  await page.getByRole("button", { name: "Fill from the Sabung Index" }).click();
  const rows = page.getByRole("list", { name: "My top 10 idols" }).getByRole("listitem");
  await expect(rows).toHaveCount(10);
  const first = (await rows.first().getByRole("link").textContent())!;
  await page.getByRole("button", { name: `Move ${first} down` }).click();
  await expect(rows.nth(1).getByRole("link")).toHaveText(first);
  // drag the new #1 under #3
  const top = (await rows.first().getByRole("link").textContent())!;
  const from = (await rows.first().boundingBox())!, to = (await rows.nth(2).boundingBox())!;
  await page.mouse.move(from.x + 10, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 10, from.y + from.height / 2 + 20, { steps: 4 });
  await page.mouse.move(to.x + 10, to.y + to.height - 4, { steps: 8 });
  await page.mouse.up();
  await expect(rows.nth(2).getByRole("link")).toHaveText(top);
  await page.reload();
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 60_000 });
  await page.getByRole("tab", { name: "My Top 10" }).click();
  await expect(rows.nth(2).getByRole("link")).toHaveText(top);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/ranking-mine.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/ranking-mine-375.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("tier list: preset, fill by rating, drag, tap to place, groups", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1280, height: 1100 });
  await ready(page, "/wiki/tiers");
  await page.getByRole("button", { name: /Classic S\+ to F/ }).click();
  const tiers = page.getByRole("list", { name: "Tiers" }).locator(":scope > li");
  await expect(tiers).toHaveCount(7);
  // drag the first pool idol into S+
  const chip = page.getByRole("region", { name: "Pool" }).locator("[data-drag-index]").first();
  const name = (await chip.getAttribute("aria-label"))!;
  const a = (await chip.boundingBox())!, b = (await tiers.first().locator("[data-drop]").boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 - 10, { steps: 3 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(tiers.first().getByRole("button", { name })).toBeVisible();
  await expect(page.getByText("1 placed")).toBeVisible();
  // tap to place: pick it up, send it back to the pool, then into S
  await tiers.first().getByRole("button", { name }).click();
  await expect(page.getByText(/^Picked up/)).toBeVisible();
  await page.getByRole("button", { name: "Back to the pool" }).click();
  await expect(page.getByText("0 placed")).toBeVisible();
  await page.getByRole("region", { name: "Pool" }).getByRole("button", { name }).click();
  await page.getByRole("button", { name: "Place in S", exact: true }).click();
  await expect(tiers.nth(1).getByRole("button", { name })).toBeVisible();
  await page.getByRole("button", { name: "Fill by rating" }).click();
  await expect(page.getByText("242 placed")).toBeVisible();
  await page.getByRole("button", { name: "Add tier" }).click();
  await expect(tiers).toHaveCount(8);
  await page.getByRole("button", { name: "Rename tier S+" }).click();
  await page.getByRole("textbox", { name: "Tier name" }).fill("GOAT");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Rename tier GOAT" })).toBeVisible();
  await page.screenshot({ path: "test-results/tiers-idols.png", fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);

  await page.getByRole("button", { name: "Girl groups" }).click();
  await page.getByRole("button", { name: /Stan scale/ }).click();
  await expect(tiers).toHaveCount(6);
  const g = page.getByRole("region", { name: "Pool" }).locator("[data-drag-index]").first();
  await g.click();
  await page.getByRole("button", { name: "Place in GOAT" }).click();
  await expect(tiers.first().locator("[data-drag-index]")).toHaveCount(1);
  await page.screenshot({ path: "test-results/tiers-groups.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Idols" }).click();
  await page.screenshot({ path: "test-results/tiers-idols-375.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
