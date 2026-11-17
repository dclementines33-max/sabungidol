// Marble Race in the match dialog (2026-11-18): the arena shows, the 3D race runs, a standing row follows a marble, a
// skipped match hands its games back and Accept saves them. Screenshot for a human look: test-results/marble-race.png.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { closeHighlights } from "./highlights";

test("Marble Race decides a league match", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 1 · live/);

  await page.goto("/play/d1");
  await page.getByRole("tab", { name: "Fixtures" }).click();
  await page.getByRole("button", { name: /^Play .* vs / }).first().click();
  const modal = page.getByRole("dialog").first();
  await expect(modal.getByText(/^Arena: /)).toBeAttached();
  await modal.getByRole("radio", { name: "Marble Race" }).click();
  await expect(modal.getByText("Tonight's arena")).toBeVisible();
  await modal.getByRole("button", { name: "Start the marble race" }).click();

  const race = page.getByRole("dialog", { name: /^Marble race · / });
  await expect(race.getByText("Game 1").first()).toBeVisible({ timeout: 60_000 });
  const rows = race.getByRole("navigation", { name: /Standing/ }).getByRole("button");
  await expect(rows).toHaveCount(2, { timeout: 30_000 });
  await rows.nth(1).click();
  await expect(rows.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(race.getByText(/^Following /)).toBeVisible();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/marble-race.png" });

  await race.getByRole("button", { name: "Skip match" }).click();
  await expect(race.getByRole("region", { name: "Race result" })).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: "test-results/marble-result.png" });
  await race.getByRole("button", { name: "Use this result" }).click();
  await expect(race).toBeHidden();
  await expect(modal.getByText(/^\d–\d · /)).toBeVisible();
  await modal.getByRole("button", { name: "Accept Result" }).click();
  await expect(page.getByText(/Result saved: \d–\d/)).toBeVisible();
  await closeHighlights(page);
});

test("Marble Race panel: rename and draw arenas, a test Grand Prix, nothing saved", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/studio/marble");
  await expect(page.getByRole("combobox", { name: "Marble 1" })).toBeVisible({ timeout: 150_000 }); // the default idols are in
  const name = page.getByLabel("Name of Encore Tower");
  await name.fill("Ryujin Tower");
  await name.blur();
  await page.getByRole("listitem").filter({ has: page.getByLabel("Name of Daesang Bowl") }).getByLabel("In the draw").uncheck();
  await expect(page.getByText("14 of 15 arenas in the draw")).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: "test-results/marble-panel.png", fullPage: true });

  await page.getByRole("slider", { name: "Marbles" }).press("ArrowRight");
  await page.getByRole("slider", { name: "Marbles" }).press("ArrowRight");
  await expect(page.getByRole("combobox", { name: /^Marble \d+$/ })).toHaveCount(4);
  await page.getByRole("listitem").filter({ has: page.getByLabel("Name of Encore Tower") }).getByRole("button", { name: "Test race here" }).click();
  await page.getByRole("button", { name: "Start the test race" }).click();
  const race = page.getByRole("dialog", { name: "Marble race · test" });
  await expect(race.getByText("Ryujin Tower").first()).toBeVisible({ timeout: 60_000 });
  await expect(race.getByText(/Grand Prix · 4 marbles/)).toBeVisible();
  await race.getByRole("button", { name: "Skip match" }).click();
  await expect(race.getByText(/Grand Prix champion/)).toBeVisible({ timeout: 90_000 });
  await race.getByRole("button", { name: "Close" }).click();
  await expect(race).toBeHidden();

  await page.reload(); // kept in this browser
  await expect(page.getByLabel("Name of Encore Tower")).toHaveValue("Ryujin Tower", { timeout: 60_000 });
});
