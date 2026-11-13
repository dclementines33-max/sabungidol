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

test("Career Stats: Combined and per competition, columns, scope, CSV", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/career");
  const count = page.getByText(/^\d+ idol$/);
  await expect(count).toHaveText("240 idol", { timeout: 60_000 }); // the 2 reserves never played
  expect(await axe(page)).toEqual([]);
  await page.getByRole("tab", { name: "Liga Divisi 1" }).click();
  await expect(count).toHaveText("120 idol");
  await page.getByRole("combobox", { name: /^Liga/ }).selectOption("D1A");
  await expect(count).toHaveText("20 idol");
  await page.getByText(/^Kolom \(/).click();
  await page.getByRole("checkbox", { name: "Poin liga" }).uncheck();
  await expect(page.getByRole("columnheader", { name: "Poin liga" })).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor CSV" }).click();
  expect((await download).suggestedFilename()).toBe("career-d1.csv");
  await page.screenshot({ path: "test-results/career-stats.png" });
});

test("Head to Head: top rivalries open a pair, record and direct match log", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/h2h");
  const first = page.getByRole("heading", { name: /Top 10 Most Matchups/ }).locator("..").getByRole("link", { name: /^\d+ match$/ }).first();
  const meetings = Number((await first.textContent({ timeout: 60_000 }))!.split(" ")[0]);
  await first.click();
  await expect(page).toHaveURL(/a=.+&b=.+/);
  await expect(page.getByRole("combobox", { name: "Idol pertama" })).not.toHaveValue("");
  await expect(page.getByRole("heading", { name: `Direct Match Log (${meetings} Matches)` })).toBeVisible();
  await expect(page.getByText(/^Match langsung: \d+ match$/)).toHaveText(`Match langsung: ${meetings} match`);
  await page.getByRole("combobox", { name: /^Season/ }).selectOption({ label: "Season 1" });
  await expect(page.getByText(/^Match langsung: \d+ match$/)).toHaveText(`Match langsung: ${meetings} match`);
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/h2h.png", fullPage: true });
});

test("Hall of Champions: titles per competition with runner-up and final score", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/champions");
  const list = page.getByRole("list", { name: "Juara per season" });
  await expect(list.getByRole("listitem")).toHaveCount(6, { timeout: 60_000 }); // Liga Divisi 1: six leagues
  await page.getByRole("tab", { name: "Unzure Cup" }).click();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(list.getByRole("listitem")).toContainText(/runner-up .+\d–\d$/);
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/champions.png", fullPage: true });
});
