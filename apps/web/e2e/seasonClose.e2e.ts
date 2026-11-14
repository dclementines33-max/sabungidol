// Fase 3 step 7: closing a season — the archive guard blocks early, then after the whole season the
// promotion lists and Rating Progression show, ratings are saved, and Season 2 starts as a draft
// that can be started. WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Season close: guard, progression, Start New Season", async ({ page }) => {
  test.setTimeout(360_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Mulai Season 1" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 1 · live/);

  await page.getByRole("button", { name: "Start New Season" }).click();
  await expect(page.getByRole("dialog").getByText(/Start New Season diblokir: .*Liga Divisi 1.* belum selesai/)).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season selesai!/)).toBeVisible({ timeout: 200_000 });
  await expect(page.getByRole("heading", { name: "Promosi ke D1 (+2)" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Badge baru season ini" })).toBeVisible(); // Fase 4 step 3
  await expect(page.getByText(/^Idol of The Season$/)).toBeVisible();
  await page.getByText(/Rating Progression: \d+ idol berubah/).click();
  await expect(page.getByRole("cell", { name: /^\d+ → \d+$/ }).first()).toBeVisible();
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.screenshot({ path: "test-results/season-close.png", fullPage: true }); // for a human look

  await page.getByRole("button", { name: "Simpan rating" }).click();
  await expect(page.getByText(/^Rating \d+ idol diperbarui$/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Start New Season" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start New Season" }).click();
  await expect(page.getByText("Season 2 dibuat sebagai draft")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("season-chip")).toHaveText("Season 2 · Draft");
  await page.getByRole("button", { name: "Mulai Season 2" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 2 · live/);
  await page.getByRole("button", { name: "Sampai fase berikutnya" }).click();
  await expect(page.getByText(/^7 match dimainkan/).first()).toBeVisible({ timeout: 60_000 }); // the opener: Daesang + 6 Music Bank
  await page.getByRole("button", { name: "Sampai fase berikutnya" }).click();
  await expect(page.getByText(/4\.940 match dimainkan/).first()).toBeVisible({ timeout: 120_000 });

  // Step 8: Season 1's progression was saved, so applying it again changes nothing (idempotent, §6.4);
  // Sync from Career Stats proposes new ratings from the archived season (§6.5).
  await page.goto("/studio/ratings");
  await page.getByRole("button", { name: "Apply Season Progression" }).click();
  await expect(page.getByRole("button", { name: "Revert (Season Progression)" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Draft: 0 perubahan" })).toBeVisible();
  await page.getByRole("button", { name: "Sync from Career Stats · Replace" }).click();
  await expect(page.getByRole("heading", { name: /^Draft: \d{2,} perubahan$/ })).toBeVisible({ timeout: 30_000 });

  // Fase 4 step 1: Rebuild Stats folds the archived Season 1 again (Season 2 is still running).
  await page.goto("/studio/settings?s=data");
  await page.getByRole("button", { name: "Rebuild Stats" }).click();
  await expect(page.getByText("Statistik dibangun ulang dari 1 season")).toBeVisible({ timeout: 60_000 });
});
