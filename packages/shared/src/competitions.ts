// Competition codes from PRD §3. Codes never change; display names live in Settings.
const LEAGUE_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export const D1_LEAGUES = LEAGUE_LETTERS.map((l) => `D1${l}` as const);
export const D2_LEAGUES = LEAGUE_LETTERS.map((l) => `D2${l}` as const);
export const B_SIDE_CUPS = LEAGUE_LETTERS.map((l) => `BS${l}` as const);

export const COMPETITION_CODES = [
  ...D1_LEAGUES, ...D2_LEAGUES, "IDL", "SWS", "LCQ", "UZC", "INK", "NUG", ...B_SIDE_CUPS, "DSG", "MBK",
] as const;

export type CompetitionCode = (typeof COMPETITION_CODES)[number];

export function isCompetitionCode(code: string): code is CompetitionCode {
  return (COMPETITION_CODES as readonly string[]).includes(code);
}
