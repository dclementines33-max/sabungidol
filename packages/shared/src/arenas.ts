// Marble Race arenas (2026-11-18, user): every match is played "on" an arena, whatever decided it (marble race, wheel,
// manual, preset or a bulk simulation). One arena for the whole match; a grand final changes arena every game.
// The 3D builds live in apps/web/src/marble; this is the list the data and stats use. Names can be renamed by the user
// (apps/web data/arenaSettings.ts); ids never change.
export type ArenaInfo = { id: string; name: string; tagline: string; glow: string };

export const ARENAS: ArenaInfo[] = [
  { id: "seoul", name: "Fight Night Circuit", tagline: "The home arena · banked corners · pin chicanes", glow: "#ff4d63" },
  { id: "busan", name: "Comeback Sprint", tagline: "Comeback stage · downhill · two big leaps", glow: "#fb923c" },
  { id: "tokyo", name: "Lightstick Ocean", tagline: "Lightstick pin board · fan-chant funnel", glow: "#a855f7" },
  { id: "frost", name: "Ice Concept Gauntlet", tagline: "Winter concept · spinners · hammers · gates", glow: "#7dd3fc" },
  { id: "jeju", name: "Encore Tower", tagline: "Three-turn encore spiral round the tower", glow: "#34d399" },
  { id: "kings", name: "Daesang Bowl", tagline: "The grand prize · sumo · last marble standing", glow: "#f0c75e" },
  { id: "split", name: "Survival Split", tagline: "Survival show · pick a path · long or brutal", glow: "#facc15" },
  { id: "cascade", name: "Music Bank Cascade", tagline: "Music Bank · six banked hairpins", glow: "#f472b6" },
  { id: "neon", name: "Inkigayo Overdrive", tagline: "Inkigayo highway · two jumps · gates", glow: "#ff2a6d" },
  { id: "crystal", name: "Unzure Glass Spiral", tagline: "Unzure Cup · glass corkscrew · blind S-bend", glow: "#a99bf0" },
  { id: "magma", name: "Pyro Stage Inferno", tagline: "Pyro stage · wrecking balls · fire jump", glow: "#ff4800" },
  { id: "factory", name: "Album Press 9", tagline: "Album factory · tumble presses · hammers", glow: "#f59e0b" },
  { id: "sky", name: "Rookie Sky Bridges", tagline: "Nugu rookies above the clouds · don't fall", glow: "#ffffff" },
  { id: "dragon", name: "Fan Chant Slalom", tagline: "Lightstick slalom · bobsled half-pipe", glow: "#ffb703" },
  { id: "abyss", name: "B-Side Abyss", tagline: "Deep cut · giant glass spiral · trench run", glow: "#00f5d4" },
];
export const ARENA_IDS = new Set(ARENAS.map((a) => a.id));

// The match look calls these the grand final: a final, a grand final, or any Daesang gala match.
export const isGrandFinal = (comp: string, round: string) => round === "F" || round === "GF" || comp === "DSG";

// The arenas a match is played on: one, or for a grand final `games` different ones (repeating only when the pool is
// smaller than the series). `pool` = the arena ids the user left on; an empty or unknown pool falls back to all.
export function drawArenas(pool: readonly string[], grandFinal: boolean, games: number, rand: () => number = Math.random): string[] {
  const ids = pool.filter((id) => ARENA_IDS.has(id));
  const order = ids.length ? [...ids] : ARENAS.map((a) => a.id);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j]!, order[i]!]; }
  return grandFinal ? Array.from({ length: games }, (_, g) => order[g % order.length]!) : [order[0]!];
}

// The arena game g was played on (one arena = every game).
export const arenaOfGame = (arenas: readonly string[], g: number) => arenas[Math.min(g, arenas.length - 1)];
