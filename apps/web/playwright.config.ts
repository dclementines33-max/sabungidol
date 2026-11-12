// Browser tests (PRD §15). Files are *.e2e.ts so Vitest leaves them alone.
import { defineConfig, devices } from "@playwright/test";

const PORT = 5180; // its own port, apart from the dev server people use (5173)

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts",
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec vite dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
