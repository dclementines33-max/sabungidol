// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoDropZone } from "./PhotoDropZone";

afterEach(cleanup);

describe("PhotoDropZone", () => {
  it("passes on dropped images only, and has a button for the keyboard", () => {
    const onFiles = vi.fn();
    const { container } = render(<PhotoDropZone onFiles={onFiles} />);
    expect(screen.getByRole("button", { name: "Pilih foto…" })).toBeTruthy();
    const photo = new File(["x"], "a.webp", { type: "image/webp" });
    const text = new File(["x"], "notes.txt", { type: "text/plain" });
    fireEvent.drop(container.firstChild!, { dataTransfer: { files: [photo, text] } });
    expect(onFiles).toHaveBeenCalledWith([photo]);
  });
});
