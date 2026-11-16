// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IdolPhoto } from "./IdolPhoto";
import { IdolSourceProvider } from "./idolSource";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("asks for the photo only once the card comes near the screen", () => {
  let report: (seen: { isIntersecting: boolean }[]) => void = () => {};
  vi.stubGlobal("IntersectionObserver", class { constructor(cb: typeof report) { report = cb; } observe() {} disconnect() {} });
  const photo = vi.fn((id: string) => (id ? "blob:mina" : undefined)); // like the app: no idol, no photo
  render(<IdolSourceProvider source={{ idol: (id) => ({ id, name: "Mina", rating: 80 }) as never, photo }}><IdolPhoto idolId="mina" size={256} /></IdolSourceProvider>);
  expect(photo).not.toHaveBeenCalledWith("mina", 256); // off screen: nothing queued
  expect(screen.queryByRole("img", { name: "Mina" })?.tagName).toBe("DIV"); // the initials
  act(() => report([{ isIntersecting: true }]));
  expect(photo).toHaveBeenCalledWith("mina", 256);
  expect(screen.getByRole("img", { name: "Mina" }).tagName).toBe("IMG");
});
