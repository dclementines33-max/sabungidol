// WCAG AA contrast for every colour pairing the tokens allow (Fase 1 gate). Reads tokens.css itself.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Read from disk: Vitest empties CSS imports, even with ?raw.
const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

const token = (name: string) => {
  const hex = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  if (!hex) throw new Error(`token ${name} missing`);
  return hex;
};
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const backgrounds = ["bg-base", "bg-raised", "surface", "surface-hover"];
const textColors = ["text-primary", "text-secondary", "accent-gold", "accent-coral", "accent-sage", "accent-sky", "neutral-taupe", "danger"];
const brands = ["gold", "amber", "coral", "rose", "orchid", "violet", "indigo", "sky", "teal", "sage", "lime", "sand"].map((b) => `brand-${b}`);

describe("token contrast (WCAG 2.1 AA)", () => {
  it.each(textColors.flatMap((fg) => backgrounds.map((bg) => [fg, bg])))("text %s on %s ≥ 4.5", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(brands.flatMap((fg) => backgrounds.map((bg) => [fg, bg])))("branding %s on %s ≥ 4.5", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(backgrounds)("control outline border-strong on %s ≥ 3", (bg) => {
    expect(contrast("border-strong", bg)).toBeGreaterThanOrEqual(3);
  });

  // Fills with dark text on them: tier chips, danger buttons, photo placeholders on a group colour.
  it.each(["accent-gold", "accent-coral", "accent-sage", "accent-sky", "neutral-taupe", "danger", ...brands])("text on a %s fill ≥ 4.5", (fill) => {
    expect(contrast("on-fill", fill)).toBeGreaterThanOrEqual(4.5);
  });
});
