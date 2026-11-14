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
  await expect(page.getByRole("heading", { name: "Lemari piala" })).toBeVisible(); // PRD §16 trophy cabinet
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Edit profil" }).click(); // step 9: edit from the profile
  await page.getByRole("dialog").getByLabel("Negara (2 huruf)").fill("JP");
  await page.getByRole("dialog").getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText(/· JP ·|· JP$/).first()).toBeVisible();
  await page.getByRole("tab", { name: "Career" }).click();
  await expect(page.getByRole("cell", { name: "Combined" })).toBeVisible();
  await page.getByRole("group", { name: "Scope karier" }).getByRole("button").nth(1).click(); // Update 2: career scope per competition
  await expect(page.getByRole("region", { name: "Streak & puncak" })).toBeVisible();
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
  await page.getByRole("tab", { name: "Swiss Play-in" }).click(); // Swiss / LCQ: through and out, no titles
  await expect(page.getByRole("columnheader", { name: "Lolos" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Gelar" })).toHaveCount(0);
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
  const first = page.getByRole("heading", { name: "Heated Rivalries" }).locator("..").getByRole("link", { name: / \d+ match$/ }).first(); // Update 3: the whole row is the link
  const meetings = Number(/(\d+) match$/.exec((await first.textContent({ timeout: 60_000 }))!)![1]);
  await first.click();
  await expect(page).toHaveURL(/a=.+&b=.+/);
  await expect(page.getByRole("combobox", { name: "Idol pertama" })).not.toHaveValue("");
  await expect(page.getByRole("heading", { name: `Direct Match Log (${meetings} Matches)` })).toBeVisible();
  await expect(page.getByText(/^Match langsung: \d+ match$/)).toHaveText(`Match langsung: ${meetings} match`);
  await page.getByRole("combobox", { name: /^Season/ }).selectOption({ label: "Season 1" });
  await expect(page.getByText(/^Match langsung: \d+ match$/)).toHaveText(`Match langsung: ${meetings} match`);
  expect(await axe(page)).toEqual([]);
  await expect(page.getByRole("table", { name: "Tale of the tape" })).toContainText("5 match terakhir"); // Update 2
  await page.screenshot({ path: "test-results/h2h.png", fullPage: true });
});

test("Hall of Champions: titles per competition with runner-up and final score", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/champions");
  const list = page.getByRole("list", { name: "Juara per season" });
  await expect(list.getByRole("article")).toHaveCount(6, { timeout: 60_000 }); // Liga Divisi 1: six leagues in one season block
  await page.getByRole("tab", { name: "Unzure Cup" }).click();
  await expect(list.getByRole("article")).toHaveCount(1);
  await expect(list.getByRole("article")).toContainText(/Final \d–\d/);
  await expect(list.getByRole("article")).toContainText(/Runner-up .+ · Ke-3 /);
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/champions.png", fullPage: true });
});

test("All-time Records: top 10 cards, see all, search keeps the rank", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/records");
  const wins = page.getByRole("region", { name: "Kemenangan terbanyak" });
  await expect(wins.getByRole("listitem")).toHaveCount(10, { timeout: 60_000 });
  await wins.getByRole("button", { name: /^Lihat semua/ }).click();
  expect(await wins.getByRole("listitem").count()).toBeGreaterThan(10);
  const fifth = wins.getByRole("listitem").nth(4);
  const [rank, name] = [await fifth.locator("span").first().textContent(), await fifth.getByRole("link").first().textContent()];
  await page.getByLabel("Cari nama").fill(name!);
  await expect(wins.getByRole("listitem").first()).toContainText(`${rank}${name}`);
  await page.getByLabel("Cari nama").fill("");
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/records.png" });
});

test("Match Database: count, filters, cursor paging, Reset Filters", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/matches");
  const count = page.getByText(/^Hasil: \d+ match$/);
  await expect(count).toHaveText("Hasil: 5583 match", { timeout: 60_000 });
  const rows = page.getByRole("list", { name: "Hasil" }).getByRole("listitem");
  await expect(rows).toHaveCount(50);
  await page.getByRole("button", { name: "Muat 50 lagi" }).click();
  await expect(rows).toHaveCount(100);
  await page.getByRole("combobox", { name: /^Kompetisi/ }).selectOption({ label: "Unzure Cup" });
  await page.getByRole("combobox", { name: /^Stage/ }).selectOption("FN");
  await expect(count).toHaveText("Hasil: 2 match"); // the final and the match for third place
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Reset Filters" }).click();
  await expect(count).toHaveText("Hasil: 5583 match");
});

test("Season Archive: honours, final tables, cups, promotion", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/seasons");
  await expect(page.getByRole("heading", { name: "Season Honours" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(20); // D1A final table
  await page.getByRole("group", { name: "Liga" }).getByRole("button", { name: "IDL" }).click();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(20);
  await expect(page.getByRole("list", { name: "Hasil cup" }).getByText("Unzure Cup")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Promosi ke D1 (18)" })).toBeVisible();
  const recap = page.waitForEvent("download"); // PRD §16 Season Recap card
  await page.getByRole("button", { name: "Unduh Season Recap" }).click();
  expect((await recap).suggestedFilename()).toBe("season-1-recap.png");
  await expect(page.getByRole("list", { name: "Ronde F" })).toBeVisible({ timeout: 60_000 }); // step 9: the past season's brackets
  await page.getByRole("button", { name: "Swiss Play-in" }).click();
  await expect(page.getByRole("region", { name: "Swiss grup D" })).toBeVisible({ timeout: 60_000 });
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/season-archive.png", fullPage: true });
});

test("Season Story: news cards linking to their matches", async () => {
  test.setTimeout(120_000);
  await page.goto("/story");
  const cards = page.getByRole("list", { name: "Berita season" }).getByRole("listitem");
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
  const first = page.getByRole("heading", { level: 2 }).getByRole("button").first();
  await first.click({ timeout: 60_000 });
  const name = await first.textContent();
  expect(await page.getByRole("list", { name: `Member ${name}` }).getByRole("listitem").count()).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Halaman grup" }).first().click(); // step 9: a page per group, with a logo upload
  await expect(page.getByRole("button", { name: /^(Unggah|Ganti) logo$/ })).toBeVisible({ timeout: 60_000 });
  expect(await axe(page)).toEqual([]);
  await page.goBack();
  await page.getByRole("heading", { level: 2 }).getByRole("button").first().click();
  await expect(page.getByRole("table", { name: `Performa member ${name}` })).toBeVisible(); // Update 2: member table
  expect(await axe(page)).toEqual([]);
  await page.getByRole("tab", { name: "Semua grup" }).click(); // Update 3: every group + add a new one
  await page.getByLabel("Nama grup baru").fill("Grup Uji Baru");
  await page.getByRole("button", { name: "Tambah grup" }).click();
  await page.getByRole("list", { name: "Semua girl group" }).getByRole("link", { name: /Grup Uji Baru/ }).click();
  await expect(page.getByText("Belum ada member.", { exact: false })).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test("Dashboard: fixed cards with the season's data", async () => {
  test.setTimeout(120_000);
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Data" }).locator("dl").first()).toContainText("5.583", { timeout: 60_000 });
  await expect(page.getByRole("region", { name: "Progress kompetisi" })).toContainText("Selesai");
  await expect(page.getByText(/^Juara Unzure Cup · Season 1$/)).toBeVisible(); // champion cover moved here from Home
  await expect(page.getByRole("table", { name: /^Klasemen / }).getByRole("row")).toHaveCount(21); // Update 2: D1 table + title race
  await expect(page.getByRole("img", { name: /^Title race / })).toBeVisible();
  await page.getByRole("button", { name: "D1F" }).click();
  await expect(page.getByRole("heading", { name: "Peta season" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Top 5 rating" }).getByRole("listitem")).toHaveCount(5);
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
});

test("Season Progression: six title races, positions, progress, titles per group", async () => {
  test.setTimeout(120_000);
  await page.goto("/wiki/progression");
  await expect(page.getByRole("img", { name: /^Title race / })).toHaveCount(6, { timeout: 60_000 });
  await expect(page.getByRole("img", { name: /^Posisi / })).toHaveCount(2); // a D1 league + The Idols (Update 3)
  await expect(page.getByRole("list", { name: "Gelar per girl group" }).getByRole("listitem").first()).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/progression.png", fullPage: true });
});

test("Home: all-time #1, the current season, backup line", async () => {
  test.setTimeout(120_000);
  await page.goto("/");
  await expect(page.getByText("#1 sepanjang masa")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Season 1" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Berita penting" }).getByRole("listitem")).toHaveCount(4); // top news, one per kind
  await expect(page.getByText("Lanjutkan season")).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByRole("heading", { name: "On This Day" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Angka sepanjang masa" })).toContainText("5.583"); // Update 2: totals, a fact, leaders
  await expect(page.getByText("Fakta acak")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Para penguasa" })).toBeVisible();
  await expect(page.getByText(/Belum pernah backup\.|Backup terakhir \d+ hari lalu\./)).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/home-cinematic.png", fullPage: true });
});
