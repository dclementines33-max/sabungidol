import type { CareerRow } from "@sabung/engine";
import { expect, it } from "vitest";
import { CAREER_COLUMNS } from "../wiki/careerColumns";
import { careerCsv } from "./careerCsv";

it("writes the chosen columns and quotes names with commas", () => {
  const row = { idolId: "x", titles: 2, wins: 5, draws: 1, losses: 0 } as CareerRow;
  const columns = CAREER_COLUMNS.filter((c) => c.id === "titles" || c.id === "wdl");
  expect(careerCsv([row], columns, () => ({ name: 'Kim, "J"', groupName: null }))).toBe('Nama,Group,Gelar,M-S-K\n"Kim, ""J""",Soloist,2,5-1-0');
});
