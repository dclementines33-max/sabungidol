import { describe, expect, it } from "vitest";
import { ulid } from "./ulid";

describe("ulid (PRD §3: stable ids for idols and groups)", () => {
  it("is 26 Crockford base32 characters", () => {
    expect(ulid()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("starts with the time, so later ids sort after earlier ones", () => {
    const fixed = () => new Uint8Array(16);
    expect(ulid(1_000, fixed) < ulid(2_000, fixed)).toBe(true);
    expect(ulid(0, fixed)).toBe("0".repeat(26));
    expect(ulid(32, fixed).slice(0, 10)).toBe("0000000010");
  });

  it("does not repeat", () => {
    const ids = new Set(Array.from({ length: 10_000 }, () => ulid()));
    expect(ids.size).toBe(10_000);
  });
});
