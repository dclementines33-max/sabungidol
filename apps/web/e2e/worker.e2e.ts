// PRD §5.10: one full season finishes in the Worker in under 10 s, with no UI frame over 50 ms.
// Runs in a fresh browser profile, so the first-time OPFS setup is included in the time.
import { expect, test } from "@playwright/test";

test("a full season runs in the Worker in < 10 s and never blocks the page > 50 ms", async ({ page }) => {
  await page.goto("/dev/worker");
  await page.getByRole("button", { name: "Simulasikan season contoh" }).click();

  const result = page.getByTestId("worker-result");
  await expect(result).toBeVisible({ timeout: 30_000 });
  const read = (label: string) => result.locator("dl", { hasText: label }).locator("dd").innerText();

  expect(await read("Penyimpanan")).toBe("OPFS");
  expect(await read("Baru tersimpan")).toBe("5.590");
  const totalSeconds = Number.parseFloat(await read("Total"));
  const longestTaskMs = Number.parseInt(await read("Long task terpanjang"), 10);
  console.log(`season total ${totalSeconds} s, longest main-thread task ${longestTaskMs} ms`);
  expect(totalSeconds).toBeLessThan(10);
  expect(longestTaskMs).toBeLessThan(50);
});
