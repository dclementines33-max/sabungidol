// Fase 3 step 5: cup panels — the road to the Unzure Cup (Swiss, LCQ, pots, groups, knockout) and a
// knockout cup played from its own panel. WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);

test("Cup panels: Unzure road and Nugu Cup", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Mulai Season 1" }).click();
  await page.getByRole("button", { name: "Main matchday 1 semua liga" }).click(); // U1: one matchday in every league
  await expect(page.getByText(/^1\d\d match dimainkan$/).first()).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Sampai fase berikutnya" }).click();
  await expect(page.getByText(/4\.8\d\d match dimainkan/).first()).toBeVisible({ timeout: 120_000 });

  await page.goto("/play/unzure");
  await page.getByRole("button", { name: "Main Swiss R1" }).click();
  await expect(page.getByText("32 match dimainkan")).toBeVisible({ timeout: 60_000 }); // round 1 in all 4 Swiss groups
  await page.getByRole("button", { name: "Main sampai akhir Swiss" }).click();
  await expect(page.getByRole("button", { name: "Main LCQ MD1" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("region", { name: "Swiss grup A" })).toBeVisible(); // 4 Swiss groups
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Main sampai juara" }).click();
  await expect(page.getByText(/^\d{3,}[\d.]* match dimainkan$/)).toBeVisible({ timeout: 120_000 }); // the rest of the road: hundreds of matches
  await page.getByRole("tab", { name: "Pot & undian" }).click();
  await expect(page.getByRole("heading", { name: "Pot 4" })).toBeVisible();
  await page.getByRole("tab", { name: "Grup" }).click();
  await expect(page.getByRole("group", { name: "Pilih grup" }).getByRole("button")).toHaveCount(16);
  await page.getByRole("button", { name: "P", exact: true }).click();
  await expect(page.getByRole("table", { name: "Grup P" })).toBeVisible();
  await page.getByRole("tab", { name: "Knockout" }).click();
  await expect(page.getByRole("list", { name: "Ronde F" }).getByText("Selesai")).toBeVisible(); // the whole bracket, final played
  expect(await axe(page)).toEqual([]);
  await expect(page.getByRole("button", { name: "Main sampai juara" })).toBeDisabled(); // a drawn group match is played, not open
  await page.getByRole("list", { name: "Ronde F" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/unzure-panel.png" }); // for a human look

  await page.goto("/play/nugu");
  // Step 6: click an open bracket match → MatchModal → Simulate → Accept; the cup then goes on from it.
  await page.getByRole("button", { name: /^Main .* vs / }).first().click(); // Nugu round 1 = plain fixtures (bracket from the last 16)
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(modal.getByText(/^Game \d berlangsung|^Selesai/)).toBeVisible();
  await expect(modal.getByText(/Game \d+ \/ \d/)).toHaveCount(0); // Update 3: the live sim never shows how many games
  expect(await axe(page)).toEqual([]);
  await page.screenshot({ path: "test-results/match-modal.png", fullPage: true }); // for a human look
  await modal.getByRole("radio", { name: "Wheel Picker" }).click();
  await modal.getByRole("button", { name: "Spin all" }).click();
  await expect(modal.getByText(/ menang$|^Seri$/)).toBeVisible({ timeout: 30_000 }); // Update 3 bug: Spin all stuck after one spin
  await modal.locator("..").screenshot({ path: "test-results/wheel.png" });
  await modal.getByRole("radio", { name: "Simulate" }).click();
  await modal.getByRole("button", { name: "Simulate", exact: true }).click();
  await modal.getByRole("button", { name: "Accept Result" }).click();
  await expect(page.getByText(/^Hasil disimpan: \d–\d$/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Main sampai selesai" }).click();
  await expect(page.getByText(/Juara Nugu Cup/i)).toBeVisible({ timeout: 120_000 });
  expect(await axe(page)).toEqual([]);

  await page.goto("/play/b-side");
  // PRD §16 final prediction: play B-Side A up to its final, pick a winner, then play it; the Dashboard counts it.
  for (const round of ["R1", "QF", "SF"]) {
    await page.getByRole("button", { name: `Main ronde berikutnya (${round})` }).click();
    await expect(page.getByRole("button", { name: /^Main ronde berikutnya \((QF|SF|F)\)$/ })).toBeVisible({ timeout: 30_000 });
  }
  await page.getByRole("group", { name: /^Tebakan / }).getByRole("button").first().click();
  await expect(page.getByRole("group", { name: /^Tebakan / }).getByRole("button", { pressed: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Main sampai selesai" }).click();
  await expect(page.getByText(/Juara B-Side Cup A/i)).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "BSC" }).click();
  await page.getByRole("button", { name: "Main sampai selesai" }).click();
  await expect(page.getByText(/Juara B-Side Cup C/i)).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Semua cup sampai selesai" }).click(); // U1: the other five B-Side cups at once
  await expect(page.getByText(/^\d+ match dimainkan$/).first()).toBeVisible({ timeout: 60_000 });
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Akurasi tebakan final" })).toContainText("dari 1 tebakan benar", { timeout: 60_000 });
});
