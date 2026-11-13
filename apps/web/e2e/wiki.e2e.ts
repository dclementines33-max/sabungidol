// Fase 4 wiki pages on one played season (played once, then every page is checked on the same profile).
// Each page: shows the season's data, and passes WCAG AA.
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
  await page.getByRole("button", { name: "Mulai Season 1" }).click();
  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season selesai!/)).toBeVisible({ timeout: 200_000 });
});
test.afterAll(() => page.close());

test("Idol Profile: from a card, tabs with career, matches, rivals", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/idols");
  await page.getByRole("list", { name: "Idol" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/wiki\/idols\/\w+/);
  await expect(page.locator("#idol-name")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible({ timeout: 60_000 });
  expect(await axe(page)).toEqual([]);
  await page.getByRole("tab", { name: "Career" }).click();
  await expect(page.getByRole("cell", { name: "Combined" })).toBeVisible();
  await page.getByRole("tab", { name: "Matches" }).click();
  await expect(page.getByText(/^Match .+: \d+ match$/)).toBeVisible();
  expect(await page.getByRole("list", { name: /^Match / }).getByRole("listitem").count()).toBeGreaterThan(0);
  await page.getByRole("tab", { name: "Rivals" }).click();
  await expect(page.getByRole("link", { name: "H2H" }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Seasons" }).click();
  await expect(page.getByText("Season 1", { exact: false }).first()).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/idol-profile.png", fullPage: true });
});
