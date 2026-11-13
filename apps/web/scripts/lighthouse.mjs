// Fase 1 gate (PRD §15): Lighthouse performance ≥ 90 on the shell, production build.
// Playwright starts Chromium (Lighthouse's own launcher cannot start it in this environment);
// Lighthouse connects to it over the debugging port. Mobile (Lighthouse's default, slow 4G) is the
// gate; desktop is reported for comparison. "mid4g" is PRD §13's own profile (4G menengah: 9 Mbps,
// 170 ms, CPU ×4), where LCP must stay under 2.0 s.
// Run with the production build being served: vite build && vite preview --port 4173
//   node scripts/lighthouse.mjs [url]
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const url = process.argv[2] ?? "http://localhost:4173/wiki/career";
const PORT = 9333;
const GATE = 90;
const MID_4G = { extends: "lighthouse:default", settings: { formFactor: "mobile", throttling: { rttMs: 170, throughputKbps: 9000, cpuSlowdownMultiplier: 4, requestLatencyMs: 637.5, downloadThroughputKbps: 8100, uploadThroughputKbps: 8100 } } };

const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
let failed = false;
try {
  for (const [name, config] of [["mobile", undefined], ["mid4g", MID_4G], ["desktop", desktopConfig]]) {
    const { lhr } = await lighthouse(url, { port: PORT, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices"] }, config);
    const score = (key) => Math.round(lhr.categories[key].score * 100);
    const value = (key) => lhr.audits[key].displayValue;
    console.log(`${name.padEnd(8)} performance ${score("performance")} · accessibility ${score("accessibility")} · best practices ${score("best-practices")}`
      + ` · FCP ${value("first-contentful-paint")} · LCP ${value("largest-contentful-paint")} · TBT ${value("total-blocking-time")} · CLS ${value("cumulative-layout-shift")}`);
    if (name === "mobile" && score("performance") < GATE) failed = true;
    if (name === "mid4g" && lhr.audits["largest-contentful-paint"].numericValue >= 2000) failed = true;
  }
} finally {
  await browser.close();
}
if (failed) {
  console.error(`Mobile performance below ${GATE}, or LCP on mid 4G not under 2.0 s`);
  process.exit(1);
}
