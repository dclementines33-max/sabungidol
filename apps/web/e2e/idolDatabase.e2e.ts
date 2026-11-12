// Fase 2 step 5: the Idol Database shows the default idols as cards and as a virtual table,
// filters and sorts them, and passes WCAG AA in both views.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const axe = async (page: import("@playwright/test").Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);

test("Idol Database: cards, table, filters, sort", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 90_000 });

  await page.goto("/wiki/idols");
  const count = page.getByText(/dari 242 idol$/);
  await expect(count).toHaveText("242 dari 242 idol", { timeout: 30_000 }); // opening the database again can be slow under parallel load
  await expect(page.getByRole("list", { name: "Idol" }).getByRole("listitem")).toHaveCount(242);
  expect(await axe(page)).toEqual([]);

  await page.getByLabel("Liga").selectOption("reserve");
  await expect(count).toHaveText("2 dari 242 idol");
  await page.getByLabel("Urutkan").selectOption("name");
  await page.getByRole("button", { name: "Tabel" }).click();
  const rows = page.getByRole("table").locator("tbody tr[aria-rowindex]");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Gaeul");
  await expect(rows.nth(1)).toContainText("Jeong Saebi");

  await page.getByLabel("Liga").selectOption("");
  await expect(count).toHaveText("242 dari 242 idol");
  expect(await rows.count()).toBeLessThan(60); // virtual: only the rows in view
  expect(await axe(page)).toEqual([]);

  await page.getByRole("combobox", { name: /^Tier/ }).selectOption("S");
  await page.getByRole("combobox", { name: /^Status/ }).selectOption("inactive"); // nobody is inactive yet
  await expect(page.getByText("Tidak ada idol yang cocok")).toBeVisible();
  await page.getByRole("button", { name: "Hapus filter" }).click();
  await expect(count).toHaveText("242 dari 242 idol");
});
