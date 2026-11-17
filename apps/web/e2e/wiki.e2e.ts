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
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season complete!/)).toBeVisible({ timeout: 200_000 });
});
test.afterAll(() => page.close());

test("Idol Profile: from a card, tabs with career, matches, rivals", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/idols");
  // Premium card redesign (2026-11-17): the grid with several tiers, desktop and phone, for a human look.
  await expect(page.locator(".tcg-card").first()).toBeVisible({ timeout: 60_000 });
  const top = page.locator('.tcg-card[data-tier="S+"], .tcg-card[data-tier="S"]').first();
  await top.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: "test-results/idol-card-grid.png" });
  await top.evaluate((el) => el.scrollIntoView({ block: "center" })); // clear of the sticky header
  await top.screenshot({ path: "test-results/idol-card-top-tier.png" });
  expect(await axe(page)).toEqual([]); // the card grid itself
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/idol-card-grid-phone.png" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("list", { name: "Idol" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/wiki\/idols\/\w+/);
  await expect(page.locator("#idol-name")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Trophy cabinet" })).toBeVisible(); // PRD §16 trophy cabinet
  await expect(page.getByRole("heading", { name: "Award cabinet" })).toBeVisible(); // 2026-11-17 season awards
  await expect(page.getByRole("region", { name: "This season · right now" })).toContainText(/Form.*Morale/); // 2026-11-17 form + morale
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Edit profile" }).click(); // step 9: edit from the profile
  await page.getByRole("dialog").getByLabel("Country (2 letters)").fill("JP");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/· Japan ·|· Japan$/).first()).toBeVisible(); // the country by name, with its flag (2026-11-17)
  await page.getByRole("tab", { name: "Career" }).click();
  await expect(page.getByRole("cell", { name: "Combined" })).toBeVisible();
  await page.getByRole("group", { name: "Career scope" }).getByRole("button").nth(1).click(); // Update 2: career scope per competition
  await expect(page.getByRole("region", { name: "Streaks & peaks" })).toBeVisible();
  await page.getByRole("tab", { name: "Matches" }).click();
  await expect(page.getByText(/^Match .+: \d+ matches$/)).toBeVisible();
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
  const count = page.getByText(/^\d+ idols$/);
  await expect(count).toHaveText("240 idols", { timeout: 60_000 }); // the 2 reserves never played
  expect(await axe(page)).toEqual([]);
  await page.getByRole("tab", { name: "Swiss Play-in" }).click(); // Swiss / LCQ: through and out, no titles
  await expect(page.getByRole("columnheader", { name: "Through" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Titles" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Division 1" }).click();
  await expect(count).toHaveText("120 idols");
  await page.getByRole("combobox", { name: /^League/ }).selectOption("D1A");
  await expect(count).toHaveText("20 idols");
  await page.getByText(/^Columns \(/).click();
  await page.getByRole("checkbox", { name: "League points" }).uncheck();
  await expect(page.getByRole("columnheader", { name: "League points" })).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("career-d1.csv");
  await page.screenshot({ path: "test-results/career-stats.png" });
});

test("Head to Head: top rivalries open a pair, record and direct match log", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/h2h");
  const first = page.getByRole("heading", { name: "Heated Rivalries" }).locator("..").getByRole("link", { name: / \d+ matches$/ }).first(); // Update 3: the whole row is the link
  const meetings = Number(/(\d+) matches$/.exec((await first.textContent({ timeout: 60_000 }))!)![1]);
  await first.click();
  await expect(page).toHaveURL(/a=.+&b=.+/);
  await expect(page.getByRole("combobox", { name: "First idol" })).not.toHaveValue("");
  await expect(page.getByRole("heading", { name: `Direct Match Log (${meetings} Matches)` })).toBeVisible();
  await expect(page.getByText(/^Head-to-head matches: \d+ matches$/)).toHaveText(`Head-to-head matches: ${meetings} matches`);
  await page.getByRole("combobox", { name: /^Season/ }).selectOption({ label: "Season 1" });
  await expect(page.getByText(/^Head-to-head matches: \d+ matches$/)).toHaveText(`Head-to-head matches: ${meetings} matches`);
  expect(await axe(page)).toEqual([]);
  await expect(page.getByRole("table", { name: "Tale of the tape" })).toContainText("Last 5 matches"); // Update 2
  await page.screenshot({ path: "test-results/h2h.png", fullPage: true });
});

test("Hall of Champions: titles per competition with runner-up and final score", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/champions");
  const list = page.getByRole("list", { name: "Champions by season" });
  await expect(list.getByRole("article")).toHaveCount(6, { timeout: 60_000 }); // Division 1: six leagues in one season block
  await page.getByRole("tab", { name: "Unzure Cup" }).click();
  await expect(list.getByRole("article")).toHaveCount(1);
  await expect(list.getByRole("article")).toContainText(/Final \d–\d/);
  await expect(list.getByRole("article")).toContainText(/Runner-up .+ · 3rd /);
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/champions.png", fullPage: true });
});

test("All-time Records: top 10 cards, see all, search keeps the rank", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/records");
  const wins = page.getByRole("region", { name: "Most wins" });
  await expect(wins.getByRole("listitem")).toHaveCount(10, { timeout: 60_000 });
  await wins.getByRole("button", { name: /^See all/ }).click();
  expect(await wins.getByRole("listitem").count()).toBeGreaterThan(10);
  const fifth = wins.getByRole("listitem").nth(4);
  const [rank, name] = [await fifth.locator("span").first().textContent(), await fifth.getByRole("link").first().textContent()];
  await page.getByLabel("Search a name").fill(name!);
  await expect(wins.getByRole("listitem").first()).toContainText(`${rank}${name}`);
  await page.getByLabel("Search a name").fill("");
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/records.png" });
  // Awards: their own section, laid out like the Hall of Champions (award history: Season 1)
  await page.getByRole("tab", { name: "Awards" }).click();
  await expect(page.getByRole("tab", { name: "MVI", selected: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Champions by season" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Most wins" }).getByRole("listitem")).toHaveCount(1); // the poster wall
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/records-awards.png", fullPage: true });
  await page.getByRole("tab", { name: "MAMA" }).click();
  await expect(page.getByRole("list", { name: "MAMA by season" }).getByRole("listitem")).toHaveCount(1);
  expect(await axe(page)).toEqual([]);
});

test("Match Database: count, filters, cursor paging, Reset Filters", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/matches");
  const count = page.getByText(/^Results: \d+ matches$/);
  await expect(count).toHaveText("Results: 5583 matches", { timeout: 60_000 });
  const rows = page.getByRole("list", { name: "Results" }).getByRole("listitem");
  await expect(rows).toHaveCount(50);
  await page.getByRole("button", { name: "Load 50 more" }).click();
  await expect(rows).toHaveCount(100);
  await page.getByRole("combobox", { name: /^Competition/ }).selectOption({ label: "Unzure Cup" });
  await page.getByRole("combobox", { name: /^Stage/ }).selectOption("FN");
  await expect(count).toHaveText("Results: 2 matches"); // the final and the match for third place
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Reset Filters" }).click();
  await expect(count).toHaveText("Results: 5583 matches");
});

test("Season Archive: honours, final tables, cups, promotion", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/seasons");
  await expect(page.getByRole("heading", { name: "Season Honours" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(20); // D1A final table
  await page.getByRole("group", { name: "League" }).getByRole("button", { name: "IDL" }).click();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(20);
  await expect(page.getByRole("list", { name: "Cup results" }).getByText("Unzure Cup")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Promoted to D1 (18)" })).toBeVisible();
  const recap = page.waitForEvent("download"); // PRD §16 Season Recap card
  await page.getByRole("button", { name: "Download Season Recap" }).click();
  expect((await recap).suggestedFilename()).toBe("season-1-recap.png");
  await expect(page.getByRole("list", { name: "Round F" })).toBeVisible({ timeout: 60_000 }); // step 9: the past season's brackets
  await page.getByRole("button", { name: "Swiss Play-in" }).click();
  await expect(page.getByRole("region", { name: "Swiss group D" })).toBeVisible({ timeout: 60_000 });
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/season-archive.png", fullPage: true });
});

test("Season Story: news cards linking to their matches", async () => {
  test.setTimeout(120_000);
  await page.goto("/story");
  const cards = page.getByRole("list", { name: "Season stories" }).getByRole("listitem");
  await expect(cards.first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Tumbangkan .+ Meski Kalah Rating \d+ Poin/).first()).toBeVisible();
  await expect(page.getByText(/^Bintang bulan ini$/)).toHaveCount(4);
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/season-story.png", fullPage: true });
  await page.getByRole("link", { name: /^Match S01-/ }).first().click();
  await expect(page).toHaveURL(/\/wiki\/h2h\?a=.+&b=.+/);
});

test("Girl Group Stats: table and a group's members", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/groups");
  await page.getByRole("button", { name: /^Show all \d+ groups$/ }).click({ timeout: 60_000 }); // compact: top 10 first
  await expect(page.getByText(/^MAMA 1×$/)).toBeVisible(); // the Season 1 MAMA group
  const first = page.getByRole("heading", { level: 2 }).getByRole("button").first();
  await first.click({ timeout: 60_000 });
  const name = await first.textContent();
  expect(await page.getByRole("list", { name: `Member ${name}` }).getByRole("listitem").count()).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Group page" }).first().click(); // step 9: a page per group, with a logo upload
  await expect(page.getByRole("button", { name: /^(Upload|Replace) logo$/ })).toBeVisible({ timeout: 60_000 });
  expect(await axe(page)).toEqual([]);
  await page.goBack();
  await page.getByRole("heading", { level: 2 }).getByRole("button").first().click();
  await expect(page.getByRole("table", { name: `${name} member stats` })).toBeVisible(); // Update 2: member table
  expect(await axe(page)).toEqual([]);
  await page.getByRole("tab", { name: "All groups" }).click(); // Update 3: every group + add a new one
  await page.getByLabel("New group name").fill("Group Uji New");
  await page.getByRole("button", { name: "Add group" }).click();
  await page.getByRole("list", { name: "All girl groups" }).getByRole("link", { name: /Group Uji New/ }).click();
  await expect(page.getByText("No members yet.", { exact: false })).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test("Dashboard: fixed cards with the season's data", async () => {
  test.setTimeout(120_000);
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Data" }).locator("dl").first()).toContainText("5,583", { timeout: 60_000 });
  await expect(page.getByRole("region", { name: "Competition progress" })).toContainText("Done");
  await expect(page.getByText(/^Unzure Cup champion · Season 1$/)).toBeVisible(); // champion cover moved here from Home
  await expect(page.getByRole("table", { name: /^Standings / }).getByRole("row")).toHaveCount(21); // Update 2: D1 table + title race
  await expect(page.getByRole("img", { name: /^Title race / })).toBeVisible();
  await page.getByRole("button", { name: "D1F" }).click();
  await expect(page.getByRole("heading", { name: "Season map" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Top 5 rating" }).getByRole("listitem")).toHaveCount(5);
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
});

test("Season Progression: six title races, positions, progress, titles per group", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/progression");
  await expect(page.getByRole("img", { name: /^Title race / })).toHaveCount(6, { timeout: 60_000 });
  await expect(page.getByRole("img", { name: /^Positions / })).toHaveCount(2); // a D1 league + The Idols (Update 3)
  const byGroup = page.getByRole("list", { name: "Titles by girl group" });
  await expect(byGroup.getByRole("listitem")).toHaveCount(5); // compact
  await page.getByRole("button", { name: /^Show all \d+ groups$/ }).click();
  expect(await byGroup.getByRole("listitem").count()).toBeGreaterThan(5);
  const telemetry = page.getByRole("region", { name: "Telemetry" }); // 2026-11-17: games won vs what the rating expected
  await expect(telemetry.getByRole("img", { name: /^Games won against expectation for \d+ idols/ })).toBeVisible();
  await expect(telemetry.getByRole("region", { name: "Over-performers" }).getByRole("listitem")).toHaveCount(5);
  const dot = telemetry.locator("circle").first();
  await dot.hover();
  await expect(telemetry.locator("svg text").last()).toHaveText(/^.+ · \d+ · [+−]?\d/); // the hovered idol's name, at once
  await telemetry.screenshot({ path: "test-results/telemetry.png" });
  await dot.click(); // her telemetry over every season
  const sheet = page.getByRole("dialog", { name: / · telemetry$/ });
  await expect(sheet.getByRole("region", { name: "Season 1" }).getByRole("row").nth(1)).toBeVisible({ timeout: 30_000 });
  await expect(sheet.getByRole("img", { name: /^Games won per season against expectation: Season 1 \d+% vs \d+%/ })).toBeVisible();
  await sheet.screenshot({ path: "test-results/idol-telemetry.png" });
  expect(await axe(page)).toEqual([]);
  await page.keyboard.press("Escape");
  const towerChapter = page.getByRole("region", { name: "Timing tower" }); // 2026-11-17: replays on demand
  await expect(towerChapter.getByRole("list", { name: /^Standings .* after matchday \d+$/ }).getByRole("listitem")).toHaveCount(20);
  await towerChapter.getByRole("button", { name: "Play", exact: true }).click();
  await expect(towerChapter.getByText(/^Matchday 1 \//)).toBeVisible(); // from the end, Play starts again at 1…
  await expect(towerChapter.getByText(/^Matchday [3-9] \//)).toBeVisible(); // …and moves on by itself
  await towerChapter.getByRole("button", { name: "Pause" }).click();
  await towerChapter.screenshot({ path: "test-results/timing-tower.png" });
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/progression.png", fullPage: true });
});

test("Home: all-time #1, the current season, backup line", async () => {
  test.setTimeout(120_000);
  await page.goto("/");
  await expect(page.getByText("#1 of all time")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Season 1" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Top stories" }).getByRole("listitem")).toHaveCount(4); // top news, one per kind
  await expect(page.getByText("Continue season")).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByRole("heading", { name: "On This Day" })).toBeVisible();
  await expect(page.getByRole("region", { name: "All-time numbers" })).toContainText("5,583"); // Update 2: totals, a fact, leaders
  await expect(page.getByText("Random fact")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The rulers" })).toBeVisible();
  await expect(page.getByText(/No backup yet\.|Last backup \d+ days ago\./)).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/home-cinematic.png", fullPage: true });
});
