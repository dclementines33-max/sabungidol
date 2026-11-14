// Update 3 V6: "Perbarui data idol" — a JSON file of web data (birthday, nationality, role) overwrites those fields for the
// idols it names (by name + group); preview first, then apply; the profile shows the role. WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const rows = [
  { name: "Rei", group: "IVE", birthday: "2004-02-03", nationality: "JP", role: "Main Rapper, Sub-Vocalist" },
  { name: "Nobody", group: "IVE", birthday: "2000-01-01" },
];

test("Perbarui data idol: preview, apply, role on the profile", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/input");
  await page.getByLabel("Pilih file .json").setInputFiles({ name: "ive.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(rows)) });
  await expect(page.getByText("1 idol akan diperbarui, 1 tidak ditemukan.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Tidak ditemukan: Nobody (IVE)")).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => v.id)).toEqual([]);
  await page.getByRole("button", { name: "Terapkan" }).click();
  await expect(page.getByText("Data 1 idol diperbarui")).toBeVisible();
  await page.goto("/wiki/idols");
  await page.getByRole("list", { name: "Idol" }).getByRole("link").filter({ has: page.getByText("Rei", { exact: true }) }).first().click();
  await expect(page.getByText(/Main Rapper, Sub-Vocalist/).first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/· JP ·/).first()).toBeVisible();

  // The same file put into "Tambah idol → File CSV/JSON" (the user did that): existing idols are refused as new ones,
  // but a button updates their birthday and nationality.
  await page.goto("/studio/input");
  await page.getByRole("button", { name: "File CSV/JSON" }).click();
  await page.getByLabel(/File CSV/).setInputFiles({ name: "idol-details.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([{ name: "Rei", group: "IVE", birthday: "2004-02-03", nationality: "kr" }])) });
  await page.getByRole("button", { name: "Perbarui lahir & negara 1 idol" }).click();
  await expect(page.getByText("Tanggal lahir & negara 1 idol diperbarui")).toBeVisible({ timeout: 30_000 });
});
