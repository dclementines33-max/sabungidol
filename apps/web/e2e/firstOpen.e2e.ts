// Found 2026-11-13: a reload in the first seconds of a fresh install broke the database for good
// (E-DB-001 on every later open) or was called "open in another tab" (E-DB-002). See data/firstOpen.ts
// and data/dbLock.ts. A real second tab must still get the other-tab message.
import { expect, test } from "@playwright/test";

const ERROR = /E-DB-00\d|E-SEED-001|E-SEASON-001/;

for (const delay of [1000, 2000]) {
  test(`a reload ${delay} ms into the first load still ends with Season 1`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await page.waitForTimeout(delay);
    await page.reload();
    await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
    await expect(page.getByText(ERROR)).toHaveCount(0);
  });
}

test("a second tab is told the app is open in another tab", async ({ context }) => {
  test.setTimeout(180_000);
  const first = await context.newPage();
  await first.goto("/");
  await expect(first.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.getByText("Sabung Idol sudah terbuka di tab lain").first()).toBeVisible({ timeout: 20_000 });
});
