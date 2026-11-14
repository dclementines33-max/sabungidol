// FASE 5 GATE (PRD §15), cloud half: a backup sent to the cloud from device A is restored on device B
// (another browser profile, same account) with identical table checksums. Needs the real stack, so it
// runs only when CLOUD_URL is set: the Worker serving the built app + API, e.g.
//   pnpm --filter @sabung/web build && pnpm --filter @sabung/api dev     (http://localhost:8787)
//   CLOUD_URL=http://localhost:8787 pnpm --filter @sabung/web e2e cloud.e2e.ts
import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

const CLOUD = process.env.CLOUD_URL;
const email = `gate-${Date.now()}@example.com`; // a fresh test account per run
const password = "gate-password-123";

const settings = async (page: Page) => {
  await page.goto(`${CLOUD}/`);
  await expect(page.getByTestId("season-chip")).toHaveText(/· Draft/, { timeout: 150_000 });
  await page.goto(`${CLOUD}/studio/settings?s=backup`);
};
const login = async (page: Page, action: "Sign in" | "Create account") => {
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole("button", { name: action }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible({ timeout: 30_000 });
};
const tablesOf = async (page: Page) => {
  await page.getByRole("combobox", { name: "Section" }).selectOption("full");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download backup" }).click()]);
  return JSON.parse(strFromU8(unzipSync(new Uint8Array(readFileSync((await download.path())!)))["manifest.json"]!)).tables;
};

test.skip(!CLOUD, "set CLOUD_URL to run the cloud gate");

test("cloud backup from device A is restored on device B with identical checksums", async ({ browser }) => {
  test.setTimeout(400_000);
  const a = await (await browser.newContext()).newPage();
  await settings(a);
  await a.getByRole("textbox", { name: "Season name" }).fill("Musim Cloud"); // something of our own
  await a.getByRole("button", { name: "Save season" }).click();
  await login(a, "Create account");
  await a.getByRole("button", { name: "Back up to cloud" }).click();
  await expect(a.getByText(/Backup uploaded to the cloud/)).toBeVisible({ timeout: 120_000 });
  const original = await tablesOf(a);

  const b = await (await browser.newContext()).newPage(); // device B: its own browser profile and data
  await settings(b);
  await login(b, "Sign in");
  const list = b.getByRole("list", { name: "Cloud backups" });
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await list.getByRole("button", { name: "Restore…" }).click();
  const dialog = b.getByRole("dialog", { name: "Import .sabung backup" });
  await expect(dialog.getByText(/added ·/)).toBeVisible({ timeout: 120_000 });
  await dialog.getByRole("radio", { name: /Replace/ }).check();
  await dialog.getByRole("button", { name: "Confirm & Apply" }).click();
  await expect(b.getByText(/Backup imported \(Replace\)/)).toBeVisible({ timeout: 60_000 });
  await expect(b.getByTestId("season-chip")).toHaveText("Musim Cloud · Draft");
  expect(await tablesOf(b)).toEqual(original);

  await list.getByRole("button", { name: "Delete" }).click(); // tidy up the test backup
  await b.getByRole("button", { name: "Delete for good" }).click();
  await expect(b.getByText("No cloud backups yet.")).toBeVisible();
});
