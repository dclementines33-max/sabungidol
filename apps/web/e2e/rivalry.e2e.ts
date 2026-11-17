// 2026-11-18 on one played season: Official Rivalries in Head to Head, the richer girl group page, the Hall of Shame.
// Each passes WCAG AA; screenshots in test-results/rivalries*.png, group-page*.png, shame*.png for a human look.
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);

test.describe.configure({ mode: "serial" });
let page: Page;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(360_000);
  page = await (await browser.newContext()).newPage();
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season complete!/)).toBeVisible({ timeout: 200_000 });
});
test.afterAll(() => page.close());

test("Head to Head: official rivalries, the pair's banner", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/h2h");
  await expect(page.getByRole("heading", { name: "Official Rivalries" })).toBeVisible({ timeout: 60_000 });
  const cards = page.getByRole("link", { name: /(Eternal Rivalry|Blood Feud|Rising Rivalry|Nemesis)/ });
  if (await cards.count()) {
    await cards.first().click();
    await expect(page.getByRole("note", { name: /^Official rivalry: / })).toBeVisible();
  }
  await page.goto("/wiki/h2h");
  await expect(page.getByRole("heading", { name: "Official Rivalries" })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("heading", { name: "Official Rivalries" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator("section[aria-labelledby=official-rivalries]").screenshot({ path: "test-results/rivalries.png" });
  expect(await axe(page)).toEqual([]);
});

test("Girl group page: hero, member power, trophy road, group wars", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/groups");
  const href = await page.locator("a[href^='/wiki/group/']").first().getAttribute("href", { timeout: 60_000 });
  await page.goto(href!);
  await expect(page).toHaveURL(/\/wiki\/group\//);
  await expect(page.getByText(/by titles$/)).toBeVisible({ timeout: 60_000 });
  for (const name of ["Member power", "Trophy road", "Group wars"]) await expect(page.getByRole("heading", { name })).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/group-page.png", fullPage: true });
  expect(await axe(page)).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "test-results/group-page-375.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.setViewportSize({ width: 1280, height: 720 });
});

test("Hall of Shame: wanted posters per category", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/shame");
  await expect(page.getByRole("heading", { name: "Most losses" })).toBeVisible({ timeout: 60_000 });
  expect(await page.getByRole("article").count()).toBeGreaterThan(5);
  await page.screenshot({ path: "test-results/shame.png", fullPage: true });
  expect(await axe(page)).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "test-results/shame-375.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
