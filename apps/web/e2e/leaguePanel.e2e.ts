// Fase 3 step 4: a league panel — play a matchday and a single match, the table with zones, WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("League panel: matchday, single match, table with zones", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Mulai Season 1" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 1 · live/);

  await page.goto("/play/d1");
  await expect(page.getByText("0/38")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Main matchday berikutnya" }).click();
  await expect(page.getByText("10 match dimainkan")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("1/38")).toBeVisible();

  await page.getByRole("tab", { name: "Klasemen" }).click();
  const table = page.getByRole("tabpanel").getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(20);
  await expect(table.getByText("Unzure Cup").first()).toBeVisible();
  await expect(table.getByText("Degradasi").first()).toBeVisible();

  await page.getByRole("tab", { name: "Fixtures" }).click();
  await page.getByRole("button", { name: /^Main .* lawan / }).first().click();
  await expect(page.getByText("1 match dimainkan")).toBeVisible({ timeout: 60_000 });
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.getByRole("tab", { name: "Klasemen" }).click();
  await page.screenshot({ path: "test-results/league-panel.png" }); // for a human look
});
