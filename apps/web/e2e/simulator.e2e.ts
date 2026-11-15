// Fase 3 step 3: Sabung Idol — start Season 1, play the league phase, then the rest; Season Honours
// appear, the integrity check finds nothing, and the page passes WCAG AA.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const axe = async (page: import("@playwright/test").Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`);

test("Sabung Idol: start, league phase, whole season, honours", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Start Season 1" }).click();
  await expect(page.getByTestId("season-chip")).toHaveText(/Season 1 · live/);

  const phases = page.getByRole("list", { name: "Season phases" });
  await expect(phases.getByRole("link", { name: /Division 1.*Ready to play/ })).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "To the next phase" }).click();
  await expect(page.getByText(/4,940 matches played/).first()).toBeVisible({ timeout: 120_000 }); // 12 leagues + The Idols
  await expect(phases.getByRole("link", { name: /Division 1.*Done/ })).toBeVisible();
  await expect(phases.getByRole("link", { name: /Unzure Cup.*(Ready to play|Waiting)/ })).toBeVisible();

  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season complete!/)).toBeVisible({ timeout: 150_000 });
  await expect(page.getByRole("heading", { name: "Season Honours" })).toBeVisible();
  await expect(page.getByRole("figure").filter({ hasText: "Season top 3" })).toBeVisible();
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null)))); // honours cards arrive one by one; axe must not sample them mid-fade
  expect(await axe(page)).toEqual([]);

  await page.goto("/studio/settings?s=data");
  await expect(page.getByText("No problems found.")).toBeVisible({ timeout: 30_000 }); // no integrity errors
});
