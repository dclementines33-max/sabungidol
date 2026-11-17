// Y2K chrome icons (2026-11-17, user picked option A): every lucide icon is stroked with the shared chrome gradient
// (ChromeIconDefs + svg.lucide rule in tokens.css); icons with a meaning colour (.icon-tone) keep it. Saves before/after
// pictures for a human look: "before" = the same page with the chrome rule switched off.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("icons: chrome stroke everywhere, readable, axe clean", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/wiki/idols");
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 150_000 });
  await page.evaluate(() => { // drop the chrome rules (they live inside @layer base)
    const drop = (list: CSSRuleList, owner: { deleteRule(i: number): void }) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const r = list[i]!;
        if (r instanceof CSSStyleRule && r.selectorText.startsWith("svg.lucide")) owner.deleteRule(i);
        else if ("cssRules" in r) drop((r as CSSGroupingRule).cssRules, r as CSSGroupingRule);
      }
    };
    for (const s of document.styleSheets) drop(s.cssRules, s);
  });
  await page.screenshot({ path: "test-results/icons-before.png" });
  await page.reload();
  await expect(page.getByTestId("season-chip")).toHaveText("Season 1 · Draft", { timeout: 60_000 });
  await page.screenshot({ path: "test-results/icons-after.png" });
  const strokes = await page.locator("svg.lucide:not(.icon-tone)").evaluateAll((els) => els.map((e) => getComputedStyle(e).stroke));
  expect(strokes.length).toBeGreaterThan(5);
  expect(strokes.every((s) => s.startsWith("url("))).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/icons-after-phone.png" });
});
