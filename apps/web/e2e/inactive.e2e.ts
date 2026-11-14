// Fase 2 step 7: Inactive Manager — deactivating a roster idol asks for a reserve as replacement.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Inactive Manager: deactivate with a replacement, activate again", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/studio/inactive");
  const active = page.getByRole("region", { name: "Active", exact: true });
  await active.getByRole("searchbox").fill("Winter");
  await active.getByRole("checkbox", { name: "Select Winter" }).check();
  await active.getByRole("button", { name: "Deactivate (1)" }).click();
  const dialog = page.getByRole("dialog", { name: "Pick roster replacements" });
  await expect(dialog.getByRole("combobox", { name: "Replacement for Winter" })).toHaveValue(/Gaeul|Jeong Saebi/); // best reserve
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => v.id);
  expect(violations).toEqual([]);
  await dialog.getByRole("button", { name: "Deactivate" }).click();
  await expect(page.getByText("1 idols deactivated, 1 league spots replaced")).toBeVisible();

  const inactive = page.getByRole("region", { name: "Inactive", exact: true });
  await inactive.getByRole("checkbox", { name: "Select Winter" }).check();
  await inactive.getByRole("button", { name: "Activate (1)" }).click();
  await expect(page.getByText("1 idols activated")).toBeVisible();
  await expect(inactive.getByRole("heading")).toContainText("(0)");
});
