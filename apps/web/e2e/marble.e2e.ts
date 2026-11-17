// Marble Race in the match dialog (2026-11-18): the arena shows, the 3D race runs, a standing row follows a marble, a
// skipped match hands its games back and Accept saves them. Screenshot for a human look: test-results/marble-race.png.
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
