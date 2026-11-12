// Fase 2 step 10 + gate (PRD §15): a full backup made in one browser and restored with Replace in
// another gives exactly the same data — the re-exported table checksums are identical. Photos too.
import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

const ready = async (page: Page) => {
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 1 · Draft|Musim Backup · Draft/, { timeout: 150_000 });
  await page.goto("/studio/settings");
};
const fullBackup = async (page: Page) => {
  await page.getByRole("combobox", { name: "Bagian" }).selectOption("full");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Unduh backup" }).click()]);
  return readFileSync((await download.path())!);
};
const manifestOf = (zip: Buffer) => {
  const files = unzipSync(new Uint8Array(zip));
  return { manifest: JSON.parse(strFromU8(files["manifest.json"]!)), photoFiles: Object.keys(files).filter((p) => p.startsWith("photos/")).length };
};

test("full backup → restore in another browser → identical checksums", async ({ browser }) => {
  test.setTimeout(300_000);
  const a = await (await browser.newContext()).newPage();
  await ready(a);
  await a.getByRole("textbox", { name: "Nama season" }).fill("Musim Backup"); // something of our own
  await a.getByRole("button", { name: "Simpan season" }).click();
  const fromA = await fullBackup(a);
  const original = manifestOf(fromA);
  expect(original.manifest.tables.idols.rows).toBe(242);
  expect(original.photoFiles).toBeGreaterThanOrEqual(242);

  const b = await (await browser.newContext()).newPage(); // another browser profile: its own ids
  await ready(b);
  await b.getByRole("button", { name: "Impor backup…" }).click();
  const dialog = b.getByRole("dialog", { name: "Impor backup .sabung" });
  await dialog.getByLabel("File").setInputFiles({ name: "backup.sabung", mimeType: "application/zip", buffer: fromA });
  await expect(dialog.getByText(/ditambah ·/)).toBeVisible({ timeout: 60_000 });
  await dialog.getByRole("radio", { name: /Replace/ }).check();
  await dialog.getByRole("button", { name: "Confirm & Apply" }).click();
  await expect(b.getByText(/Backup diimpor \(Replace\)/)).toBeVisible({ timeout: 60_000 });
  await expect(b.getByTestId("season-chip")).toHaveText("Musim Backup · Draft");
  await expect(b.getByText("snapshot", { exact: false }).first()).toBeVisible(); // the auto-snapshot before Replace

  const restored = manifestOf(await fullBackup(b));
  expect(restored.manifest.tables).toEqual(original.manifest.tables); // same rows, same checksums
  expect(restored.photoFiles).toBe(original.photoFiles);
});
