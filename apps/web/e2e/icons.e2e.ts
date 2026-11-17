// Sabung Idol icon kit (2026-11-17, task 3; replaced lucide + the Y2K chrome stroke): every icon is ours (svg.si), none
// from lucide is left, sparks are painted, and the page stays axe clean. Saves icons-after(-phone).png for a human look.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("icons: our kit everywhere, sparks painted, axe clean", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/wiki/idols");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  expect(await page.locator("svg.lucide").count()).toBe(0);
  expect(await page.locator("svg.si").count()).toBeGreaterThan(5);
  const sparks = await page.locator("svg.si .si-spark").evaluateAll((els) => els.map((e) => getComputedStyle(e).fill));
  expect(sparks.length).toBeGreaterThan(3);
  expect(sparks.every((f) => f.startsWith("rgb("))).toBe(true);
  await page.screenshot({ path: "test-results/icons-after.png" });
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/icons-after-phone.png" });
});
