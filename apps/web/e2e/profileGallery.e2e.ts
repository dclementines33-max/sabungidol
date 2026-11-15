// Idol Profile → Gallery → "Add photos": the picker takes several images at once on a phone-width screen and keeps the old ones.
import { expect, test } from "@playwright/test";

const png = (hue: number) => ({ name: `p${hue}.png`, mimeType: "image/png", buffer: Buffer.from(`iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`, "base64") });

test("Add photos on the profile gallery at 390 px", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/wiki/idols");
  await page.getByRole("list", { name: "Idol" }).getByRole("link").first().click();
  await page.getByRole("tab", { name: /^Gallery/ }).click();
  const add = page.getByRole("button", { name: "Add photos" });
  await expect(add).toBeVisible();
  const input = page.locator('input[type="file"][accept="image/*"][multiple]');
  await input.setInputFiles([png(1), png(2)]);
  const grid = page.getByRole("list", { name: /gallery$/ });
  await expect(grid.getByRole("listitem")).toHaveCount(2, { timeout: 30_000 });
  await input.setInputFiles([png(3)]);
  await expect(grid.getByRole("listitem")).toHaveCount(3, { timeout: 30_000 }); // the first two stayed
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); // no sideways scroll
});
