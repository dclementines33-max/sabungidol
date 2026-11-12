// Fase 2 step 3 (user decision): a fresh install starts with the 242 idols from seed/idols.json,
// photos included, and loads them only once.
import { expect, test } from "@playwright/test";

test("a fresh install loads the default idols once, with their photos", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await expect(page.getByText("242 idol dari data bawaan dimuat")).toBeVisible({ timeout: 90_000 });

  await page.goto("/dev/data");
  const count = (label: string) => page.getByTestId("data-counts").locator("dl", { hasText: label }).locator("dd");
  await expect(count("Idol")).toHaveText("242");
  await expect(count("Girl group")).toHaveText("43");
  await expect(count("Soloist")).toHaveText("6");
  await expect(count("Dengan foto")).toHaveText("242");

  const firstPhoto = page.locator("article img").first(); // a real stored photo, not the initials placeholder
  await expect(firstPhoto).toBeVisible();
  await expect.poll(() => firstPhoto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await page.reload();
  await expect(count("Idol")).toHaveText("242"); // not loaded a second time
  await page.waitForTimeout(3000);
  await expect(page.getByText("242 idol dari data bawaan dimuat")).toHaveCount(0);
});
