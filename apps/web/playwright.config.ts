// Browser tests (PRD §15). Files are *.e2e.ts so Vitest leaves them alone.
import { defineConfig, devices } from "@playwright/test";

const PORT = 5180; // its own port, apart from the dev server people use (5173)

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 }, // every fresh profile opens its own database; under parallel load that takes longer than 5 s
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // No WebKit project: Playwright's WebKit on Windows has an OPFS backend without file operations
    // (NotSupportedError), so it cannot run this app like real Safari does. Test Safari on a Mac/iPhone.
  ],
  webServer: [
    {
      command: `pnpm exec vite dev --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // The design system's stories, built and served statically for the accessibility check.
      command: "pnpm --filter @sabung/ui build-storybook --quiet && pnpm --filter @sabung/ui exec vite preview --outDir storybook-static --port 6007 --strictPort",
      url: "http://localhost:6007/index.json",
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
