// Types for controller.js (the 3D race stays plain JS, ported from the prototype).
export const COLORS: string[];

export type RacePlayer = { name: string; photo: string | null; rating: number };
export type RaceLed = { title: string; photos: { url: string; caption?: string; contain?: boolean }[] };
export type RaceOptions = { players: RacePlayer[]; bestOf: number; arenaIds: string[]; advantage?: number; led?: RaceLed; names?: Record<string, string> };
export type RaceStanding =
  | { a: number; b: number; result: "A" | "B" | "D" | null }
  | { points: number[]; wins: number[]; table: number[]; result: number | null };
export type RaceSnapshot = {
  phase: "idle" | "intro" | "running" | "between" | "finished";
  lost: boolean; intro: boolean; lights: number; banner: string | null; follow: number | null;
  g: number; gp: boolean; bestOf: number; grandFinal: boolean;
  arena: { id: string; name: string; tagline: string } | null;
  arenas: string[]; clock: number;
  order: { k: number; note: string; boost: boolean }[];
  standing: RaceStanding | null;
  winners: number[]; // the winner (marble index) of each game played
  games: ("A" | "B")[]; // a duel's games, as acceptMatch takes them
};
export type Race = {
  start(opts: RaceOptions): void;
  show(opts: RaceOptions): Promise<void>;
  skipGame(): void;
  skipMatch(): void;
  setSpeed(x: number): void;
  setCamera(mode: "tv" | "chase" | "free"): void;
  follow(k: number | null): void;
  dispose(): void;
};
export function createRace(opts: { canvas: HTMLCanvasElement; tags: HTMLElement; quality?: "high" | "low"; onUpdate: (s: RaceSnapshot) => void }): Promise<Race>;
