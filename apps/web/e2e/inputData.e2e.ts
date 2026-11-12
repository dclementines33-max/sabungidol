// Fase 2 step 6: Input Data — paste with preview, save, photos matched by file name and confirmed,
// per-idol actions (delete, refused for an idol in the draft roster), and WCAG AA.
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const seed = JSON.parse(readFileSync(new URL("../../../seed/idols.json", import.meta.url), "utf8")) as { idols: { photoUrl: string }[] };
const [, type, base64] = /^data:(image\/\w+);base64,(.*)$/.exec(seed.idols[0]!.photoUrl)!;
const photo = (name: string) => ({ name, mimeType: type!, buffer: Buffer.from(base64!, "base64") });
const axe = async (page: import("@playwright/test").Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);

test("Input Data: paste, photos, actions", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/input");

  // Paste: one new, one with an empty rating (yellow), one duplicate of the default data (red).
  await page.getByRole("textbox", { name: /Satu idol per baris/ }).fill("Test Satu | Tes Grup | 81\nTest Dua | Tes Grup\nWinter | aespa | 90");
  await expect(page.getByText("1 baru · 1 peringatan · 1 ditolak")).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Simpan 2 idol" }).click();
  await expect(page.getByText("2 idol disimpan")).toBeVisible();

  // Photos: the file names find the two new idols; one is sure, one only a suggestion.
  await page.locator('input[type="file"][multiple]').setInputFiles([photo("test-satu.webp"), photo("test dua tes grup.webp"), photo("IMG_0001.webp")]);
  await expect(page.getByText("2 cocok · 0 saran, periksa · 1 belum dipilih")).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Simpan 2 foto" }).click();
  await expect(page.getByText("2 foto disimpan")).toBeVisible();

  // Actions: a new idol can be deleted; one in the Season 1 draft roster cannot.
  const search = page.getByRole("searchbox", { name: "Cari" });
  await search.fill("Test Satu");
  const row = page.getByRole("table").locator("tbody tr[aria-rowindex]");
  await expect(row).toHaveCount(1);
  await expect(row.locator("img")).toBeVisible(); // its new photo
  await row.getByRole("button", { name: "Hapus" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hapus" }).click();
  await expect(page.getByText("Test Satu dihapus")).toBeVisible();
  await expect(row).toHaveCount(0);

  await search.fill("Winter");
  await row.first().getByRole("button", { name: "Hapus" }).click();
  const dialog = page.getByRole("dialog", { name: "Winter tidak bisa dihapus" });
  await expect(dialog).toContainText(/Ada di roster D1\w Season 1/);
  await dialog.getByRole("button", { name: "Batal" }).click();
});
