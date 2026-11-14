// Which competition panel shows which Settings competition (Swiss and LCQ live in the Unzure panel),
// and how a title key reads ("D1A", "IDL-PO", "MBK-D1A" …).
import { type CompetitionKey, SEASON_COMPETITIONS } from "@sabung/shared";

export const PANEL_OF: Record<CompetitionKey, string> = {
  D1: "d1", D2: "d2", IDL: "the-idols", SWS: "unzure", LCQ: "unzure", UZC: "unzure",
  INK: "inkigayo", NUG: "nugu", BS: "b-side", DSG: "daesang", MBK: "music-bank",
};

export function titleLabel(key: string): string {
  if (/^D[12][A-F]$/.test(key)) return `League ${key}`;
  if (/^BS[A-F]$/.test(key)) return `B-Side Cup ${key.slice(2)}`;
  if (key.startsWith("MBK-")) return `Music Bank Cup ${key.slice(4)}`;
  return { IDL: "The Idols (league)", "IDL-PO": "The Idols Playoff", UZC: "Unzure Cup", NUG: "Nugu Cup", INK: "Inkigayo Cup", DSG: "Daesang Cup" }[key] ?? key;
}

// Branding (Settings → Branding): D1X has its own name, colour and logo; D2X follows D1X as its Divisi 2.
export type Brand = { name: string; color?: string; logoId?: string | null };
export type SavedCompetition = { code: string; name: string; branding: unknown };

export function brandOf(saved: SavedCompetition[], code: string): Brand {
  const league = /^D([12])([A-F])$/.exec(code);
  const s = saved.find((c) => c.code === (league ? `D1${league[2]}` : code));
  const { color, logoId } = (s?.branding ?? {}) as { color?: string; logoId?: string | null };
  const name = league ? (s ? (league[1] === "1" ? s.name : `${s.name} · Division 2`) : `League ${code}`) : (s?.name ?? titleLabel(code));
  return { name, color, logoId };
}

export function labelOf(saved: SavedCompetition[], key: string): string {
  if (/^D[12][A-F]$/.test(key)) return brandOf(saved, key).name;
  if (key.startsWith("MBK-")) return `Music Bank Cup ${brandOf(saved, key.slice(4)).name}`;
  const comp = SEASON_COMPETITIONS.find((c) => key.startsWith(c.key));
  const custom = comp && saved.find((c) => c.code === comp.key)?.name;
  return custom ? titleLabel(key).replace(comp.name, custom) : titleLabel(key);
}
