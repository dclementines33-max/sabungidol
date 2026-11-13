import { describe, expect, it } from "vitest";
import { brandOf, labelOf } from "./competitionLinks";

const saved = [
  { code: "D1A", name: "Starlight League", branding: { color: "brand-rose", logoId: "logo1" } },
  { code: "UZC", name: "Unzure Major", branding: {} },
  { code: "IDL", name: "Idol Masters", branding: {} },
];

describe("branding labels", () => {
  it("D2X follows D1X: same logo and colour, name as its Divisi 2", () => {
    expect(brandOf(saved, "D1A")).toEqual({ name: "Starlight League", color: "brand-rose", logoId: "logo1" });
    expect(brandOf(saved, "D2A")).toEqual({ name: "Starlight League · Divisi 2", color: "brand-rose", logoId: "logo1" });
    expect(brandOf(saved, "D2B").name).toBe("Liga D2B"); // nothing set for D1B
  });

  it("uses custom names in title keys and falls back to the defaults", () => {
    expect(labelOf(saved, "D2A")).toBe("Starlight League · Divisi 2");
    expect(labelOf(saved, "MBK-D1A")).toBe("Music Bank Cup Starlight League");
    expect(labelOf(saved, "UZC")).toBe("Unzure Major");
    expect(labelOf(saved, "IDL-PO")).toBe("Idol Masters Playoff");
    expect(labelOf(saved, "NUG")).toBe("Nugu Cup");
  });
});
