// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";
import { FormBadge } from "./FormBadge";
import { IdolCard } from "./IdolCard";
import { IdolPhoto } from "./IdolPhoto";
import { RatingBadge } from "./RatingBadge";
import { SampleIdols } from "./sampleIdols";
import { StatTile } from "./StatTile";

afterEach(cleanup);

describe("RatingBadge", () => {
  it.each([[95, "S", "bg-accent-gold"], [80, "A", "bg-accent-coral"], [79, "B", "bg-accent-sage"], [60, "C", "bg-accent-sky"], [59, "D", "bg-neutral-taupe"]])(
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
    expect(photo.textContent).toBe("MK");
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
  it("shows name, group, rating, form and titles", () => {
    render(<SampleIdols><IdolCard idolId="mina" /></SampleIdols>);
    expect(screen.getByText("Aurora")).toBeTruthy();
    expect(screen.getByLabelText("Rating 92, tier S")).toBeTruthy();
    expect(screen.getByLabelText("On Fire, last 5: W W W W W")).toBeTruthy();
    expect(screen.getByLabelText("7 titles")).toBeTruthy();
  });
  it("says Soloist without a group and hides zero titles", () => {
    render(<SampleIdols><IdolCard idolId="jiwoo" /></SampleIdols>);
    expect(screen.getByText("Soloist")).toBeTruthy();
    expect(screen.queryByLabelText(/titles/)).toBeNull();
  });
});

describe("StatTile", () => {
  it.each([[3, "+3", "text-accent-sage"], [-2, "−2", "text-danger"], [0, "±0", "text-neutral-taupe"]])(
    "delta %i reads %s", (delta, text, color) => {
      render(<StatTile label="Rating" value={88} delta={delta} />);
      expect(screen.getByText(text).className).toContain(color);
    });
});

describe("EmptyState", () => {
  it("shows the title, the hint and the next action", () => {
    render(<EmptyState icon={Users} title="Belum ada idol" description="Tambah idol lewat Input Data." action={<button type="button">Input Data</button>} />);
    expect(screen.getByText("Belum ada idol")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Input Data" })).toBeTruthy();
  });
});
