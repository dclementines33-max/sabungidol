// Fase 2 step 11: the first-run welcome on Home — what is ready, where the next steps are. WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Home welcomes a fresh install and points to the next steps", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await expect(page.getByText("Season 1 siap disusun.")).toBeVisible();
  const tiles = page.locator("dl");
  await expect(tiles.filter({ hasText: "Idol" }).locator("dd")).toHaveText("242");
  await expect(tiles.filter({ hasText: "Liga" }).locator("dd")).toHaveText("12");
  await expect(tiles.filter({ hasText: "Cadangan" }).locator("dd")).toHaveText("2");
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.getByRole("link", { name: /Tambah idol & foto/ }).click();
  await expect(page).toHaveURL(/\/studio\/input$/);
});
