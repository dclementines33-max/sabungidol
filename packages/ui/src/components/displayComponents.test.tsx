// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { Users } from "../icons";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";
import { FormBadge } from "./FormBadge";
import { IdolCard } from "./IdolCard";
import { IdolPhoto } from "./IdolPhoto";
import { IdolSourceProvider } from "./idolSource";
import { RatingBadge } from "./RatingBadge";
import { SampleIdols } from "./sampleIdols";
import { StatTile } from "./StatTile";

afterEach(cleanup);

describe("RatingBadge", () => {
  it.each([[96, "S+", "bg-tier-splus"], [95, "S", "bg-tier-s"], [83, "A", "bg-tier-a"], [82, "B", "bg-tier-b"], [65, "C", "bg-tier-c"], [55, "D", "bg-tier-d"], [54, "F", "bg-tier-f"]])(
    "rating %i is tier %s in its tier colour", (rating, tier, fill) => {
      render(<RatingBadge rating={rating} />);
      const badge = screen.getByLabelText(`Rating ${rating}, tier ${tier}`);
      expect(badge.className).toContain(fill);
    });
});

describe("FormBadge", () => {
  it("tells the last five results in its label and tooltip", () => {
    render(<FormBadge form="Cold Slump" recent={["W", "L", "L", "D", "L", "L"]} />);
    const badge = screen.getByLabelText("Cold Slump, last 5: L L D L L");
    expect(badge.getAttribute("title")).toBe("Cold Slump, last 5: L L D L L");
  });
  it("has no results part when there are none", () => {
    render(<FormBadge form="Steady" />);
    expect(screen.getByLabelText("Steady")).toBeTruthy();
  });
});

describe("IdolPhoto", () => {
  it("shows initials on the group colour when there is no photo", () => {
    render(<SampleIdols><IdolPhoto idolId="mina" size={64} /></SampleIdols>);
    const photo = screen.getByRole("img", { name: "Mina Kim" });
    expect(photo.querySelector("[data-initials]")?.getAttribute("data-initials")).toBe("MK"); // drawn by CSS, not text
    expect(photo.getAttribute("style")).toContain("var(--color-brand-rose)");
  });
  it("shows the stored photo, lazily, when there is one", () => {
    render(<SampleIdols photos={{ mina: "blob:mina-64" }}><IdolPhoto idolId="mina" size={64} /></SampleIdols>);
    const img = screen.getByRole("img", { name: "Mina Kim" }) as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toBe("blob:mina-64");
    expect(img.getAttribute("loading")).toBe("lazy");
  });
  it("needs a known idol", () => {
    expect(() => render(<SampleIdols><IdolPhoto idolId="nobody" size={64} /></SampleIdols>)).toThrow(/Unknown idol/);
  });
});

describe("IdolCard", () => {
  it("shows name, group, rating in its tier colour and titles, but not form", () => {
    render(<SampleIdols><IdolCard idolId="mina" /></SampleIdols>);
    expect(screen.getByText("Mina Kim")).toBeTruthy();
    expect(screen.getByText("Aurora")).toBeTruthy();
    expect(screen.getByLabelText("Rating 92, tier S")).toBeTruthy();
    // the tier picks the card frame (premium redesign 2026-11-17) and fills the tier badge
    expect(screen.getByRole("article").getAttribute("data-tier")).toBe("S");
    expect(document.querySelector(".bg-tier-s")?.textContent).toBe("S");
    expect(screen.queryByLabelText(/On Fire/)).toBeNull();
    expect(screen.getByLabelText("7 titles")).toBeTruthy();
  });
  it("says Soloist without a group and hides zero titles", () => {
    render(<SampleIdols><IdolCard idolId="jiwoo" /></SampleIdols>);
    expect(screen.getByText("Soloist")).toBeTruthy();
    expect(screen.queryByLabelText(/titles/)).toBeNull();
    expect(screen.queryByText("Inactive")).toBeNull();
  });
  it("shows the nationality as a flag image named by country, and the group logo when the group has one", () => {
    const idol = { id: "x", name: "Xia", groupName: "Nova", rating: 96, nationality: "kr", groupLogoId: "logo1" };
    const { container } = render(<IdolSourceProvider source={{ idol: () => idol as never, photo: () => undefined, galleryPhoto: (id) => (id === "logo1" ? "blob:logo" : undefined) }}><IdolCard idolId="x" /></IdolSourceProvider>);
    const flag = screen.getByRole("img", { name: "South Korea" }) as HTMLImageElement;
    expect(flag.getAttribute("src")).toBe("/flags/kr.svg");
    expect(container.querySelector('img[src="blob:logo"]')).toBeTruthy();
    expect(screen.getByRole("article").getAttribute("data-tier")).toBe("S+");
  });
  it("a country without a flag file shows its letters, still named", () => {
    render(<IdolSourceProvider source={{ idol: () => ({ id: "y", name: "Yu", groupName: null, rating: 70, nationality: "FR" }) as never, photo: () => undefined }}><IdolCard idolId="y" /></IdolSourceProvider>);
    expect(screen.getByRole("img", { name: "France" }).textContent).toBe("FR");
  });
  it("marks an inactive idol", () => {
    render(<SampleIdols><IdolCard idolId="rina" /></SampleIdols>);
    expect(screen.getByText("Inactive")).toBeTruthy();
  });
});

describe("StatTile", () => {
  it.each([[3, "+3", "text-cool"], [-2, "−2", "text-danger"], [0, "±0", "text-muted"]])(
    "delta %i reads %s", (delta, text, color) => {
      render(<StatTile label="Rating" value={88} delta={delta} />);
      expect(screen.getByText(text).className).toContain(color);
    });
});

describe("EmptyState", () => {
  it("shows the title, the hint and the next action", () => {
    render(<EmptyState icon={Users} title="No idols yet" description="Add idols lewat Input Data." action={<button type="button">Input Data</button>} />);
    expect(screen.getByText("No idols yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Input Data" })).toBeTruthy();
  });
});
