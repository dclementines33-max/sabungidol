// Found 2026-11-13: a reload in the first seconds of a fresh install can break the new database for
// good (PGlite's OPFS storage never refills its file pool). The way out is a reset the user confirms
// (data/databaseReset.ts); it is never automatic. A real second tab must get the other-tab message.
import { expect, test } from "@playwright/test";

for (const delay of [1000, 1500, 2000]) {
  test(`a reload ${delay} ms into the first load ends with Season 1, through the confirmed reset if needed`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto("/");
    await page.waitForTimeout(delay);
    await page.reload();
    const chip = page.getByTestId("season-chip");
    const broke = await Promise.race([
      expect(chip).toHaveText("Season 1 · Draft", { timeout: 150_000 }).then(() => false),
      page.getByText("E-DB-001").first().waitFor({ timeout: 150_000 }).then(() => true),
    ]);
    if (broke) {
      await page.getByRole("button", { name: "Restart database…" }).click();
      const dialog = page.getByRole("dialog", { name: "Restart the database?" });
      const confirm = dialog.getByRole("button", { name: "Delete and restart" });
      await expect(confirm).toBeDisabled(); // nothing is deleted before DELETE is typed
      await dialog.getByRole("textbox").fill("DELETE");
      await confirm.click();
      await expect(chip).toHaveText("Season 1 · Draft", { timeout: 150_000 });
    }
    console.log(`FIRSTOPEN ${delay} ${broke ? "broke, reset by the user" : "ok"}`);
    await expect(page.getByText("E-DB-001")).toHaveCount(0);
  });
}

test("a second tab is told the app is open in another tab", async ({ context }) => {
  test.setTimeout(180_000);
  const first = await context.newPage();
  await first.goto("/");
  await expect(first.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.getByText("Sabung Idol is already open in another tab").first()).toBeVisible({ timeout: 20_000 });
});
