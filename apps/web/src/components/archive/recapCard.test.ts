import { expect, it } from "vitest";
import { recapOrder } from "./recapCard";

it("puts the Unzure champion first, then the big cups, then the rest by key", () => {
  expect(recapOrder(["D1B", "NUG", "UZC", "BSA", "DSG", "D1A", "IDL-PO"])).toEqual(["UZC", "DSG", "IDL-PO", "NUG", "BSA", "D1A", "D1B"]);
});
