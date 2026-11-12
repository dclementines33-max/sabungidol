// Which competition panel shows which Settings competition (Swiss and LCQ live in the Unzure panel),
// and how a title key reads ("D1A", "IDL-PO", "MBK-D1A" …).
import type { CompetitionKey } from "@sabung/shared";

export const PANEL_OF: Record<CompetitionKey, string> = {
  D1: "d1", D2: "d2", IDL: "the-idols", SWS: "unzure", LCQ: "unzure", UZC: "unzure",
  INK: "inkigayo", NUG: "nugu", BS: "b-side", DSG: "daesang", MBK: "music-bank",
};

export function titleLabel(key: string): string {
  if (/^D[12][A-F]$/.test(key)) return `Liga ${key}`;
  if (/^BS[A-F]$/.test(key)) return `B-Side Cup ${key.slice(2)}`;
  if (key.startsWith("MBK-")) return `Music Bank Cup ${key.slice(4)}`;
  return { IDL: "The Idols (liga)", "IDL-PO": "The Idols Playoff", UZC: "Unzure Cup", NUG: "Nugu Cup", INK: "Inkigayo Cup", DSG: "Daesang Cup" }[key] ?? key;
}
