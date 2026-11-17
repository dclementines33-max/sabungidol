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
  const popup = page.getByRole("dialog", { name: "Simulation highlights" }); // every bulk play ends on its highlights
  // 2026-11-17: full screen on an opaque backdrop (nothing behind gives a result away); a league = timeline + live standings
  expect(await popup.evaluate((el) => [getComputedStyle(el).backgroundColor, el.getBoundingClientRect().width >= innerWidth, el.getBoundingClientRect().height >= innerHeight]))
    .toEqual(["rgb(1, 0, 3)", true, true]);
  const live = popup.getByRole("region", { name: "Live standings" });
  await expect(live.getByRole("list", { name: /^Standings after matchday \d+$/ }).getByRole("listitem")).toHaveCount(20);
  const first = await live.getByRole("list").getAttribute("aria-label");
  await expect(live.getByRole("list")).not.toHaveAttribute("aria-label", first!, { timeout: 10_000 }); // the clock moves the standings
  await popup.screenshot({ path: "test-results/broadcast-league.png" });
  expect(await axe(page)).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/broadcast-league-phone.png" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await popup.getByRole("button", { name: "Skip to the end" }).click();
  await popup.getByRole("button", { name: "Close" }).click();
  await expect(phases.getByRole("link", { name: /Division 1.*Done/ })).toBeVisible();
  await expect(phases.getByRole("link", { name: /Unzure Cup.*(Ready to play|Waiting)/ })).toBeVisible();

  await page.getByRole("button", { name: "Simulate Whole Season" }).click();
  await expect(page.getByText(/Season complete!/)).toBeVisible({ timeout: 150_000 });
  const review = page.getByRole("dialog", { name: "Simulation highlights" });
  await expect(review.getByRole("region", { name: "Champions" })).toBeVisible(); // the whole season is a review, not a track
  await review.screenshot({ path: "test-results/season-review.png" });
  await review.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("heading", { name: "Season Honours" })).toBeVisible();
  const mvi = page.getByRole("figure", { name: "Most Valuable Idol" }); // the season awards: MVI + Idol of the Season lead
  await expect(page.getByRole("figure", { name: "Best season overall" })).toBeVisible();
  await expect(page.getByRole("figure", { name: "Best girl group" })).toBeVisible(); // MAMA
  await mvi.getByRole("button", { name: /^Top \d+ nominees$/ }).click();
  await expect(mvi.getByRole("list", { name: "MVI nominees" }).getByRole("listitem")).toHaveCount(10);
  await page.getByRole("region", { name: "Season awards" }).screenshot({ path: "test-results/season-awards.png" });
  const top = page.getByRole("list", { name: "Season top 3" });
  await expect(top.getByRole("article", { name: /^Idol of the Season: / })).toBeVisible();
  await expect(top.getByRole("list", { name: "Final places" })).toHaveCount(3); // places from the replay, not only after Close Season
  const uzc = page.getByRole("article", { name: /^Unzure Cup champion: / });
  await expect(uzc).toBeVisible();
  expect((await uzc.boundingBox())!.width).toBeGreaterThan(900); // full width of the honours block, not a narrow column
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => null)))); // honours cards arrive one by one; axe must not sample them mid-fade (the breaking-news dot pulses forever)
  expect(await axe(page)).toEqual([]);
  await uzc.screenshot({ path: "test-results/honours-unzure.png" });

  await page.goto("/studio/settings?s=data");
  await expect(page.getByText("No problems found.")).toBeVisible({ timeout: 30_000 }); // no integrity errors
});
