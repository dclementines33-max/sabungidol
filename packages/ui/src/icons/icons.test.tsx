// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as icons from "./index";

describe("icon kit", () => {
  const all = Object.entries(icons) as [string, icons.Icon][];

  it("every icon draws a 24-box svg, hidden from screen readers unless labelled", () => {
    expect(all.length).toBeGreaterThan(55);
    for (const [name, Icon] of all) {
      const { container, unmount } = render(<Icon size={18} className="extra" />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox"), name).toBe("0 0 24 24");
      expect(svg.getAttribute("aria-hidden"), name).toBe("true");
      expect(svg.classList.contains("si") && svg.classList.contains("extra"), name).toBe(true);
      expect(svg.querySelectorAll("path, circle").length, name).toBeGreaterThan(0);
      expect(container.innerHTML, name).not.toContain("NaN");
      unmount();
    }
  });

  it("a labelled icon is an image with that name", () => {
    const { getByRole } = render(<icons.TriangleAlert aria-label="also in D1A" />);
    expect(getByRole("img", { name: "also in D1A" })).toBeTruthy();
  });
});
