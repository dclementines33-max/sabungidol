// Fase 1 gate (PRD §15): WCAG 2.1 AA for every story in the design system's Storybook, so each
// §9 component is checked as it renders, in each of its states.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const STORYBOOK = "http://localhost:6007";
const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test("every story has no WCAG AA violations", async ({ page, request }) => {
  test.setTimeout(300_000);
  const index = (await (await request.get(`${STORYBOOK}/index.json`)).json()) as { entries: Record<string, { id: string; type: string }> };
  const stories = Object.values(index.entries).filter((e) => e.type === "story").map((e) => e.id);
  expect(stories.length).toBeGreaterThan(30);

  const problems: string[] = [];
  for (const id of stories) {
    await page.goto(`${STORYBOOK}/iframe.html?id=${id}&viewMode=story`);
    await page.locator("#storybook-root > *").first().waitFor();
    await page.waitForTimeout(1200); // let entrance animations (≤ 800 ms delay + 320 ms) finish before contrast is measured
    const { violations } = await new AxeBuilder({ page }).include("body").withTags(WCAG_AA).analyze();
    for (const v of violations) problems.push(`${id}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")} — ${v.help}`);
  }
  console.log(`checked ${stories.length} stories`);
  expect(problems).toEqual([]);
});
