// Fase 2 GATE (PRD §15): 240 idols with photos entered through Input Data in under 5 minutes.
// (The other half — a backup restored in another browser gives identical checksums — is backup.e2e.ts.)
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const seed = JSON.parse(readFileSync(new URL("../../../seed/idols.json", import.meta.url), "utf8")) as { idols: { photoUrl: string }[] };
const [, type, base64] = /^data:(image\/\w+);base64,(.*)$/.exec(seed.idols[0]!.photoUrl)!;
const n = (i: number) => String(i + 1).padStart(3, "0");

test("GATE: 240 idols + photos through Input Data in < 5 minutes", async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/input");

  const started = Date.now();
  const lines = Array.from({ length: 240 }, (_, i) => `Gerbang ${n(i)} | Group Gerbang | ${50 + (i % 50)}`).join("\n");
  await page.getByRole("textbox", { name: /One idol per line/ }).fill(lines);
  await expect(page.getByText("240 new · 0 warnings · 0 rejected")).toBeVisible();
  await page.getByRole("button", { name: "Save 240 idols" }).click();
  await expect(page.getByText("240 idols saved")).toBeVisible({ timeout: 60_000 });

  const photo = Buffer.from(base64!, "base64");
  await page.locator('input[type="file"][accept="image/*"][multiple]').setInputFiles(Array.from({ length: 240 }, (_, i) => ({ name: `gerbang-${n(i)}.webp`, mimeType: type!, buffer: photo })));
  await expect(page.getByText("240 matched · 0 suggested, check · 0 not picked")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Save 240 photos" }).click();
  await expect(page.getByText("240 photos saved")).toBeVisible({ timeout: 290_000 });
  const seconds = (Date.now() - started) / 1000;
  console.log(`GATE: 240 idols + photos in ${seconds.toFixed(1)} s`);
  expect(seconds).toBeLessThan(300);

  await page.goto("/wiki/idols"); // they are all there, with photos
  await page.getByRole("combobox", { name: /^Group/ }).selectOption({ label: "Group Gerbang" });
  await expect(page.getByText("240 of 482 idols")).toBeVisible();
  await expect(page.getByRole("list", { name: "Idol" }).locator("img").first()).toBeVisible();
});
