// Fase 2 step 9: Settings part B — Engine Tuning presets with the odds preview, the Data section,
// Reset Season, and deleting all data (typed confirmation; a fresh install follows). WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Settings B: tuning, data, reset season, delete everything", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/settings");

  const gap10 = page.getByRole("row", { name: /^10 / });
  await expect(gap10.getByRole("cell").nth(1)).toHaveText("64%"); // the PRD table
  await page.getByRole("button", { name: "Chaotic" }).click();
  await expect(gap10.getByRole("cell").nth(1)).toHaveText("59%");
  await page.getByRole("button", { name: "Save Engine Tuning" }).click();
  await expect(page.getByText("Engine Tuning saved")).toBeVisible();
  await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link", { name: /^Data/ }).click();
  await expect(page.getByText(/Matches saved/)).toBeVisible();
  await expect(page.getByText("No problems found.")).toBeVisible(); // integrity check on a fresh install
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);
  expect(violations).toEqual([]);
  await page.reload();
  await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link", { name: /^Season & rules/ }).click();
  await expect(page.getByRole("button", { name: "Chaotic" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link", { name: /^Danger Zone/ }).click();
  await page.getByRole("button", { name: "Reset season…" }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("Season 1"); // the season's own name confirms it
  await page.getByRole("dialog").getByRole("button", { name: "Reset season" }).click();
  await expect(page.getByText("Season 1 reset to draft")).toBeVisible();

  await page.getByRole("button", { name: "Delete all data…" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete all data?" });
  await expect(dialog.getByRole("button", { name: "Delete all" })).toBeDisabled();
  await dialog.getByRole("textbox").fill("DELETE ALL");
  await dialog.getByRole("button", { name: "Delete all" }).click();
  await expect(page.getByText("242 default idols loaded")).toBeVisible({ timeout: 150_000 }); // a fresh install again
  await page.getByRole("navigation", { name: "Settings sections" }).getByRole("link", { name: /^Season & rules/ }).click();
  await expect(page.getByRole("button", { name: "Realistic" })).toHaveAttribute("aria-pressed", "true");
});
