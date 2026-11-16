// Fase 3 step 7: closing a season — the archive guard blocks early, then after the whole season the
// promotion lists and Rating Progression show, ratings are saved, and Season 2 starts as a draft
// that can be started. WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { closeHighlights } from "./highlights";

test("Season close: guard, progression, Start New Season", async ({ page }) => {
  test.setTimeout(360_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 1 · live/);

  await page.getByRole("button", { name: "Start New Season" }).click();
  await expect(page.getByRole("dialog").getByText(/Start New Season is blocked: .*Division 1.* not finished/)).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season complete!/)).toBeVisible({ timeout: 200_000 });
  await closeHighlights(page);
  await expect(page.getByRole("heading", { name: "Promoted to D1 (+2)" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "New badges this season" })).toBeVisible(); // Fase 4 step 3
  await expect(page.getByText(/^Idol of The Season$/)).toBeVisible();
  await expect(page.getByText(/Rating Progression: \d+ idols change/)).toBeVisible();
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => null)))); // honours cards fade in one by one: axe must not sample one mid-fade
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.screenshot({ path: "test-results/season-close.png", fullPage: true }); // for a human look

  await page.getByRole("button", { name: "Save ratings…" }).click(); // 2026-11-15: the season verdict first
  const verdict = page.getByRole("dialog", { name: "Season verdict" });
  await expect(verdict.getByRole("region", { name: "Risers" }).getByRole("listitem").first()).toBeVisible();
  await expect(verdict.getByRole("region", { name: "Fallers" }).getByRole("listitem").first()).toBeVisible();
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => v.id)).toEqual([]);
  await verdict.screenshot({ path: "test-results/season-verdict.png" });
  await verdict.getByRole("button", { name: "Save ratings" }).click();
  await expect(page.getByText(/^Ratings updated for \d+ idols$/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Start New Season" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start New Season" }).click();
  await expect(page.getByText("Season 2 created as a draft")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("season-chip")).toHaveText("Season 2 · Draft");
  await page.getByRole("button", { name: "Start Season 2" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 2 · live/);
  await page.getByRole("button", { name: "To the next phase" }).click();
  await expect(page.getByText(/^7 matches played/).first()).toBeVisible({ timeout: 60_000 }); // the opener: Daesang + 6 Music Bank
  await closeHighlights(page);
  await page.getByRole("button", { name: "To the next phase" }).click();
  await expect(page.getByText(/4,940 matches played/).first()).toBeVisible({ timeout: 120_000 });
  await closeHighlights(page);

  // Step 8: Season 1's progression was saved, so applying it again changes nothing (idempotent, §6.4);
  // Sync from Career Stats proposes new ratings from the archived season (§6.5).
  await page.goto("/studio/ratings");
  await page.getByRole("button", { name: "Apply Season Progression" }).click();
  await expect(page.getByRole("button", { name: "Revert (Season Progression)" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Draft: 0 changes" })).toBeVisible();
  await page.getByRole("button", { name: "Sync from Career Stats · Replace" }).click();
  await expect(page.getByRole("heading", { name: /^Draft: \d{2,} changes$/ })).toBeVisible({ timeout: 30_000 });

  // Fase 4 step 1: Rebuild Stats folds the archived Season 1 again (Season 2 is still running).
  await page.goto("/studio/settings?s=data");
  await page.getByRole("button", { name: "Rebuild Stats" }).click();
  await expect(page.getByText("Statistics rebuilt from 1 seasons")).toBeVisible({ timeout: 60_000 });
});
