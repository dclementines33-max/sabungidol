// Fase 3 step 8: Rating Manager — a preset fills the draft, Revert undoes it, a single edit is saved
// (rating_history), and the Engine Lab simulates 1,000 matches with a histogram. WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Rating Manager: draft, revert, save, Engine Lab", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/ratings");

  await page.getByRole("button", { name: "Reset All to 75" }).click();
  await expect(page.getByRole("heading", { name: /^Draft: \d{3} perubahan$/ })).toBeVisible();
  await page.getByRole("button", { name: /^Revert/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Revert" }).click();
  await expect(page.getByRole("heading", { name: "Draft: 0 perubahan" })).toBeVisible();

  const first = page.getByRole("spinbutton", { name: /^Rating baru / }).first();
  await first.fill("99");
  await expect(page.getByRole("heading", { name: "Draft: 1 perubahan" })).toBeVisible();
  await page.getByRole("button", { name: "Save Now" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Save Now" }).click();
  await expect(page.getByText("Rating 1 idol disimpan")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Draft: 0 perubahan" })).toBeVisible();
  await expect(first).toHaveValue("99");

  for (const [label, pick] of [["Idol A", 0], ["Idol B", 1]] as const) {
    await page.getByRole("combobox", { name: label }).fill("a");
    await page.getByRole("listbox", { name: label }).getByRole("option").nth(pick).click();
  }
  await page.getByRole("button", { name: "Simulasi 1.000" }).click();
  await expect(page.getByText(/Skor akhir dari 1\.000 match/)).toBeVisible();
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.screenshot({ path: "test-results/rating-manager.png", fullPage: true }); // for a human look
});
