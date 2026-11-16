// Fase 3 step 4: a league panel — play a matchday and a single match, the table with zones, WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { closeHighlights } from "./highlights";

test("League panel: matchday, single match, table with zones", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 1 · live/);

  await page.goto("/play/d1");
  await expect(page.getByText("0/38")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Play next matchday" }).click();
  await expect(page.getByText("10 matches played")).toBeVisible({ timeout: 60_000 });
  await closeHighlights(page);
  await expect(page.getByText("1/38")).toBeVisible();

  await page.getByRole("tab", { name: "Standings" }).click();
  const table = page.getByRole("tabpanel").getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(20);
  await expect(table.getByText("Unzure Cup").first()).toBeVisible();
  await expect(table.getByText("Relegation").first()).toBeVisible();

  await page.getByRole("tab", { name: "Fixtures" }).click();
  // A single match goes through the MatchModal (click the match itself); Score presets = one click.
  await page.getByRole("button", { name: /^Play .* vs / }).first().click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("radio", { name: "Score presets" }).click();
  const accept = modal.getByRole("button", { name: "Accept Result" });
  await modal.getByRole("group", { name: "Score presets" }).getByRole("button").first().click();
  await expect(modal.getByText(/wins$/)).toBeVisible();
  await expect(modal.getByRole("rowheader", { name: "Career W-D-L" })).toBeVisible();
  await expect(modal.getByRole("row", { name: /\(\+?-?\d+\.\d\) Morale \w+ \(/ })).toBeVisible(); // each idol's morale going in, e.g. "Buoyant (+2.0)"
  await page.screenshot({ path: "test-results/match-modal-preset.png" }); // for a human look
  await accept.click();
  await expect(page.getByText(/^Result saved: \d–\d$/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("done").first()).toBeVisible(); // matchday 1 is done
  await expect(page.getByRole("button", { name: /^Play .* vs / })).toHaveCount(9); // matchday 2 open: one played via the modal
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.getByRole("tab", { name: "Standings" }).click();
  await page.screenshot({ path: "test-results/league-panel.png" }); // for a human look
});
