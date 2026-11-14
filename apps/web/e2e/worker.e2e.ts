// PRD §5.10: one full season finishes in the Worker in under 10 s, with no UI frame over 50 ms.
// The season is timed from the click (simulate + save). Opening the database is timed on its own:
// in this fresh browser profile it includes the one-time OPFS setup, which is not part of a season.
import { expect, test } from "@playwright/test";

test("a full season runs in the Worker in < 10 s and never blocks the page > 50 ms", async ({ page }) => {
  await page.goto("/dev/worker");
  await expect(page.getByText(/Database siap dalam/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Simulasikan season contoh" }).click();

  const result = page.getByTestId("worker-result");
  await expect(result).toBeVisible({ timeout: 30_000 });
  const read = (label: string) => result.locator("dl", { hasText: label }).locator("dd").innerText();

  expect(await read("Penyimpanan")).toBe("OPFS");
  expect(await read("Baru tersimpan")).toBe("5,583");
  const seasonSeconds = Number.parseFloat(await read("Season: simulasi + simpan"));
  const setupSeconds = Number.parseFloat(await read("Penyiapan database"));
  const longestTaskMs = Number.parseInt(await read("Long task terpanjang"), 10);
  console.log(`season ${seasonSeconds} s, database setup ${setupSeconds} s, longest main-thread task ${longestTaskMs} ms`);
  expect(seasonSeconds).toBeLessThan(10);
  expect(longestTaskMs).toBeLessThan(50);
  expect(setupSeconds).toBeLessThan(30); // one-time per device; a big regression still shows up here
});
