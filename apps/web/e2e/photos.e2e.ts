// Fase 2 step 2: a real photo from the default data goes into OPFS, comes back at every size,
// is never enlarged, and is still there after a reload.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const seed = JSON.parse(readFileSync(new URL("../../../seed/idols.json", import.meta.url), "utf8")) as { idols: { name: string; photoUrl: string }[] };
const first = seed.idols[0];
const [, type, base64] = /^data:(image\/\w+);base64,(.*)$/.exec(first.photoUrl)!;

test(`stores ${first.name}'s photo and serves 64 / 256 / 1024 without enlarging`, async ({ page }) => {
  await page.goto("/dev/photos");
  await page.getByLabel("Pilih foto").setInputFiles({ name: "photo.webp", mimeType: type, buffer: Buffer.from(base64, "base64") });
  const photoId = (await page.getByTestId("photo-id").innerText()).trim();
  expect(photoId).toMatch(/^[0-9A-Z]{26}$/);

  const longestSide = async (size: number) => {
    const img = page.locator(`img[data-size="${size}"]`);
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    return img.evaluate((el: HTMLImageElement) => Math.max(el.naturalWidth, el.naturalHeight));
  };
  expect(await longestSide(64)).toBe(64);
  const original = await longestSide(256);
  expect(original).toBeLessThanOrEqual(256);
  expect(await longestSide(1024)).toBe(original); // no bigger photo exists: the original, not a blown-up copy

  await page.goto(`/dev/photos?photo=${photoId}`); // a fresh page reads it back from OPFS
  expect(await longestSide(64)).toBe(64);
});
