// Fase 1 gate (PRD §15): WCAG 2.1 AA on the shell as it really renders — colour contrast of the
// text on screen, names, roles, labels — in its normal state and with every notification layer,
// the command palette and the mobile sheet open.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoViolations(page: Page, where: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  const summary = violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")} — ${v.help}`);
  expect(summary, `axe violations on ${where}`).toEqual([]);
}

test.describe("shell, desktop", () => {
  for (const path of ["/", "/wiki/career", "/play/unzure", "/studio/settings", "/nope"]) {
    test(`no WCAG AA violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoViolations(page, path);
    });
  }

  test("no violations with toasts, pinned notices, an error card and the bell open", async ({ page }) => {
    await page.goto("/dev/notices");
    for (const label of ["Info", "Success + Undo", "Warning", "Error"]) await page.getByRole("button", { name: label }).click();
    await page.getByRole("button", { name: /^Notifications/ }).click();
    await expect(page.getByRole("region", { name: "Notification history" })).toBeVisible();
    await expectNoViolations(page, "notification layers");
  });

  test("no violations with the blocker dialog open", async ({ page }) => {
    await page.goto("/dev/notices");
    await page.getByRole("button", { name: "Blocker" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoViolations(page, "blocker dialog");
  });

  test("no violations with the command palette open", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("combobox", { name: "Search panels or commands" });
    // A click before React is ready is replayed after hydration (Fase 3 step 9): one click is enough.
    await page.getByRole("button", { name: /Search…/ }).click();
    await expect(search).toBeVisible();
    await search.fill("cup");
    await expectNoViolations(page, "command palette");
  });

  test("no violations on a crashed panel", async ({ page }) => {
    await page.goto("/dev/crash");
    await expect(page.getByRole("alert")).toBeVisible();
    await expectNoViolations(page, "panel error card");
  });
});

test.describe("shell, mobile 375 px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no violations with the bottom bar and the Play sheet", async ({ page }) => {
    await page.goto("/wiki/career");
    await expectNoViolations(page, "mobile page");
    // Clicked as soon as it shows, maybe before React took over: the early click is replayed (Fase 3 step 9).
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("dialog", { name: "Play" })).toBeVisible();
    await expectNoViolations(page, "mobile Play sheet");
  });
});
