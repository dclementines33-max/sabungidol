// Fase 2 step 9: Settings part B — Engine Tuning presets with the odds preview, the Data section,
// Reset Season, and deleting all data (typed confirmation; a fresh install follows). WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Settings B: tuning, data, reset season, delete everything", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/settings");

  const gap10 = page.getByRole("row", { name: /^10 / });
  await expect(gap10.getByRole("cell").nth(1)).toHaveText("64%"); // the PRD table
  await page.getByRole("button", { name: "Chaotic" }).click();
  await expect(gap10.getByRole("cell").nth(1)).toHaveText("59%");
  await page.getByRole("button", { name: "Simpan Engine Tuning" }).click();
  await expect(page.getByText("Engine Tuning disimpan")).toBeVisible();
  await page.getByRole("navigation", { name: "Bagian settings" }).getByRole("link", { name: /^Data/ }).click();
  await expect(page.getByText(/Match tersimpan/)).toBeVisible();
  await expect(page.getByText("Tidak ada masalah.")).toBeVisible(); // integrity check on a fresh install
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.reload();
  await page.getByRole("navigation", { name: "Bagian settings" }).getByRole("link", { name: /^Season & aturan/ }).click();
  await expect(page.getByRole("button", { name: "Chaotic" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("navigation", { name: "Bagian settings" }).getByRole("link", { name: /^Danger Zone/ }).click();
  await page.getByRole("button", { name: "Reset season…" }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("Season 1"); // the season's own name confirms it
  await page.getByRole("dialog").getByRole("button", { name: "Reset season" }).click();
  await expect(page.getByText("Season 1 direset ke draft")).toBeVisible();

  await page.getByRole("button", { name: "Hapus semua data…" }).click();
  const dialog = page.getByRole("dialog", { name: "Hapus semua data?" });
  await expect(dialog.getByRole("button", { name: "Hapus semua" })).toBeDisabled();
  await dialog.getByRole("textbox").fill("HAPUS SEMUA");
  await dialog.getByRole("button", { name: "Hapus semua" }).click();
  await expect(page.getByText("242 idol dari data bawaan dimuat")).toBeVisible({ timeout: 150_000 }); // a fresh install again
  await page.getByRole("navigation", { name: "Bagian settings" }).getByRole("link", { name: /^Season & aturan/ }).click();
  await expect(page.getByRole("button", { name: "Realistic" })).toHaveAttribute("aria-pressed", "true");
});
