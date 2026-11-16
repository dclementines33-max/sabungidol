// A bulk play ends on the Simulation Timeline popup when it found highlights (it opens with the "N matches played"
// toast). Call this right after waiting for that toast: it closes the popup, or does nothing when there is none.
import type { Page } from "@playwright/test";

// sure = this play crowns a champion, so the popup is certain to come: wait for it (an earlier toast can match a wait).
export async function closeHighlights(page: Page, sure = false) {
  const popup = page.getByRole("dialog", { name: "Simulation highlights" });
  if (sure || (await popup.isVisible())) await popup.getByRole("button", { name: "Close" }).click({ timeout: 120_000 });
}
