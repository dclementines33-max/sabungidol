// Arena themes: one place that says which competition wears which colour theme (the colours are in tokens.css, [data-arena]).
// League letters A–F map to the six arenas; D2 and the B-Side cups follow their D1 letter. Use `arenaOf(code)` as `data-arena`.
export const LEAGUE_ARENAS = [
  { letter: "A", arena: "east", name: "East Nation League" },
  { letter: "B", arena: "hybe", name: "HYBE. CO" },
  { letter: "C", arena: "sm", name: "SM Entertainment" },
  { letter: "D", arena: "jyp", name: "JYP Entertainment" },
  { letter: "E", arena: "yg", name: "YG Entertainment" },
  { letter: "F", arena: "west", name: "West Nation League" },
] as const;

export function arenaOf(code: string): string | undefined {
  const league = /^(?:D[12]|BS)([A-F])$/.exec(code);
  if (league) return LEAGUE_ARENAS.find((l) => l.letter === league[1])?.arena;
  return { UZC: "uzc", SWS: "uzc", LCQ: "uzc", IDL: "idl" }[code];
}

// The default league name before the user names it in Settings → Branding.
export const defaultLeagueName = (letter: string) => LEAGUE_ARENAS.find((l) => l.letter === letter)?.name ?? `League ${letter}`;
