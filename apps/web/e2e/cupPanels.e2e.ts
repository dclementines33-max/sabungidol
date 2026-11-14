// Fase 3 step 5: cup panels — the road to the Unzure Cup (Swiss, LCQ, pots, groups, knockout) and a
// knockout cup played from its own panel. WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);

test("Cup panels: Unzure road and Nugu Cup", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await page.getByRole("button", { name: "Play matchday 1 in every league" }).click(); // U1: one matchday in every league
  await expect(page.getByText(/^1\d\d matches played$/).first()).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "To the next phase" }).click();
  await expect(page.getByText(/4,8\d\d matches played/).first()).toBeVisible({ timeout: 120_000 });

  await page.goto("/play/unzure");
  await page.getByRole("button", { name: "Play Swiss R1" }).click();
  await expect(page.getByText("32 matches played")).toBeVisible({ timeout: 60_000 }); // round 1 in all 4 Swiss groups
  await page.getByRole("button", { name: "Play to the end of Swiss" }).click();
  await expect(page.getByRole("button", { name: "Play LCQ MD1" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("region", { name: "Swiss group A" })).toBeVisible(); // 4 Swiss groups
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Play to the champion" }).click();
  await expect(page.getByText(/^(\d{3}|\d{1,3}(,\d{3})+) matches played$/)).toBeVisible({ timeout: 120_000 }); // the rest of the road: hundreds of matches
  await page.getByRole("tab", { name: "Pots & draw" }).click();
  await expect(page.getByRole("heading", { name: "Pot 4" })).toBeVisible();
  await page.getByRole("tab", { name: "Groups" }).click();
  await expect(page.getByRole("group", { name: "Pick a group" }).getByRole("button")).toHaveCount(16);
  await page.getByRole("button", { name: "P", exact: true }).click();
  await expect(page.getByRole("table", { name: "Group P" })).toBeVisible();
  await page.getByRole("tab", { name: "Knockout" }).click();
  await expect(page.getByRole("list", { name: "Round F" }).getByText("Done")).toBeVisible(); // the whole bracket, final played
  expect(await axe(page)).toEqual([]);
  await expect(page.getByRole("button", { name: "Play to the champion" })).toBeDisabled(); // a drawn group match is played, not open
  await page.getByRole("list", { name: "Round F" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/unzure-panel.png" }); // for a human look

  await page.goto("/play/nugu");
  // Step 6: click an open bracket match → MatchModal → Simulate → Accept; the cup then goes on from it.
  await page.getByRole("button", { name: /^Play .* vs / }).first().click(); // Nugu round 1 = plain fixtures (bracket from the last 16)
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(modal.getByText(/^Game \d in play|^Full time/)).toBeVisible();
  await expect(modal.getByText(/Game \d+ \/ \d/)).toHaveCount(0); // Update 3: the live sim never shows how many games
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/match-modal.png", fullPage: true }); // for a human look
  await modal.getByRole("radio", { name: "Spotlight Picker" }).click();
  await modal.getByRole("button", { name: "Spin all" }).click();
  await expect(modal.getByText(/ wins$|^Draw$/)).toBeVisible({ timeout: 30_000 }); // Update 3 bug: Spin all stuck after one spin
  await modal.screenshot({ path: "test-results/spotlight-picker.png" });
  await modal.getByRole("radio", { name: "Simulate" }).click();
  await modal.getByRole("button", { name: "Simulate", exact: true }).click();
  await modal.getByRole("button", { name: "Accept Result" }).click();
  await expect(page.getByText(/^Result saved: \d–\d$/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Play to the end" }).click();
  await expect(page.getByText(/Champion Nugu Cup/i)).toBeVisible({ timeout: 120_000 });
  expect(await axe(page)).toEqual([]);

  await page.goto("/play/b-side");
  await page.getByRole("button", { name: "Play to the end" }).click();
  await expect(page.getByText(/Champion B-Side Cup A/i)).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "BSC" }).click();
  await page.getByRole("button", { name: "Play to the end" }).click();
  await expect(page.getByText(/Champion B-Side Cup C/i)).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Every cup to the end" }).click(); // U1: the other five B-Side cups at once
  await expect(page.getByText(/^\d+ matches played$/).first()).toBeVisible({ timeout: 60_000 });
});
