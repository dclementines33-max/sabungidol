// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_IDOLS, SampleIdols } from "./sampleIdols";
import { SearchableIdolSelect } from "./SearchableIdolSelect";

afterEach(cleanup);
const ids = SAMPLE_IDOLS.map((i) => i.id);

function Harness({ onChange }: { onChange: (id: string | null) => void }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <SampleIdols>
      <SearchableIdolSelect label="Idol A" idolIds={ids} value={value} onChange={(id) => { setValue(id); onChange(id); }} />
    </SampleIdols>
  );
}

describe("SearchableIdolSelect (PRD §9)", () => {
  it("filters by name or group, ignoring case", () => {
    render(<Harness onChange={() => {}} />);
    const input = screen.getByRole("combobox", { name: "Idol A" });
    fireEvent.change(input, { target: { value: "velvet" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([expect.stringContaining("Han Sora"), expect.stringContaining("Rina")]);
    fireEvent.change(input, { target: { value: "SOLO" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("works fully by keyboard", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[1].id);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("yuna");
    expect((input as HTMLInputElement).value).toBe("Yuna");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("picks with the mouse, and editing the text clears the pick", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole("option", { name: /Jiwoo Park/ }));
    expect(onChange).toHaveBeenLastCalledWith("jiwoo");
    fireEvent.change(input, { target: { value: "Jiwo" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("says when nothing matches, and Esc closes", () => {
    render(<Harness onChange={() => {}} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No matching idols")).toBeTruthy();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
