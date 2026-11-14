// Fase 2 step 8: Settings part A — season name, competitions with dependency warnings, BoN per
// stage, branding, roster counts, Data Maker preview + apply, and WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Settings A: season, branding, roster, Data Maker", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/settings");

  await page.getByRole("textbox", { name: "Season name" }).fill("Musim Pertama");
  await page.getByRole("checkbox", { name: "Swiss Play-in" }).uncheck();
  await expect(page.getByText("Last Chance Qualifier needs Swiss Play-in, which is switched off.")).toBeVisible();
  await page.getByRole("row", { name: /Unzure Cup/ }).getByRole("combobox", { name: /knockout/ }).selectOption("7");
  await page.getByRole("button", { name: "Save season" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText("Musim Pertama · Draft");

  await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link", { name: /^Branding/ }).click();
  await page.getByRole("radio", { name: "teal" }).first().check({ force: true }); // the native radio is visually hidden behind its swatch
  await page.getByRole("button", { name: "Save D1A" }).click();
  await expect(page.getByText(/Branding .* saved/)).toBeVisible();

  await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link", { name: /^Leagues & rosters/ }).click();

  await expect(page.getByRole("button", { name: /D1A\s*20\/20 idol/ })).toBeVisible();
  await page.getByRole("button", { name: "Preview redraw" }).click();
  await expect(page.getByRole("list", { name: "League preview" }).getByRole("listitem")).toHaveCount(12);
  await expect(page.getByText("2 reserves")).toBeVisible();
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.getByRole("button", { name: "Apply to season…" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("12 leagues redrawn")).toBeVisible();

  await page.reload(); // everything was saved
  await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link", { name: /^Season & rules/ }).click();
  await expect(page.getByRole("checkbox", { name: "Swiss Play-in" })).not.toBeChecked();
  await expect(page.getByRole("row", { name: /Unzure Cup/ }).getByRole("combobox", { name: /knockout/ })).toHaveValue("7");
});
