// FASE 3 GATE (PRD §15): three seasons in a row through the app — start, simulate the whole season,
// save Rating Progression, Start New Season — each with exactly its matches (Season 1: 5,583; later seasons 5,590 = + Daesang and 6 Music Bank as opener) (ids are unique by the
// primary key and carry the season number), then the integrity check finds nothing.
import { expect, test } from "@playwright/test";

test("GATE: 3 seasons in a row, no integrity errors, no duplicate matches", async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  for (const n of [1, 2, 3]) {
    await page.getByRole("button", { name: `Mulai Season ${n}` }).click();
    await expect(page.getByTestId("season-chip")).toHaveText(`Season ${n} · live`);
    await page.getByRole("button", { name: "Simulate Whole Season" }).click();
    await expect(page.getByText(/Season selesai!/).first()).toBeVisible({ timeout: 200_000 });
    await expect(page.getByText(n === 1 ? /^5\.583 match dimainkan$/ : /^5\.590 match dimainkan$/)).toBeVisible(); // the whole season, nothing twice
    await page.getByRole("button", { name: "Simpan rating" }).click();
    await expect(page.getByText(/^Rating \d+ idol diperbarui$/).first()).toBeVisible({ timeout: 30_000 });
    if (n === 3) break;
    await page.getByRole("button", { name: "Start New Season" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Start New Season" }).click();
    await expect(page.getByTestId("season-chip")).toHaveText(`Season ${n + 1} · Draft`, { timeout: 30_000 });
  }
  await page.goto("/studio/settings?s=data");
  await expect(page.getByText("Tidak ada masalah.")).toBeVisible({ timeout: 60_000 });
});
