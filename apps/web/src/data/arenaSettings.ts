// The user's Marble Race settings (Marble Race panel, 2026-11-18): arena names, which arenas are in the draw, extra LED
// screen photos and the race defaults. Matches store arena ids only, so a rename shows everywhere at once.
// shortcut: kept in this browser's storage like the tier lists (not in backups or cloud sync; LED photos are small JPEG
// data URLs, at most MAX_LED); move into the database if the user wants them on another device.
import { ARENAS } from "@sabung/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_LED = 8;
export type RaceSetup = { camera: "tv" | "chase" | "free"; quality: "high" | "low"; advantage: number; speed: 1 | 2 | 4 };
export const DEFAULT_SETUP: RaceSetup = { camera: "tv", quality: "high", advantage: 1, speed: 1 };

type State = {
  names: Record<string, string>;
  off: string[];
  led: string[];
  setup: RaceSetup;
  rename: (id: string, name: string) => void;
  toggle: (id: string) => void;
  addLed: (url: string) => void;
  removeLed: (i: number) => void;
  setSetup: (patch: Partial<RaceSetup>) => void;
};

export const useArenaSettings = create<State>()(persist((set) => ({
  names: {},
  off: [],
  led: [],
  setup: DEFAULT_SETUP,
  rename: (id, name) => set((s) => ({ names: { ...s.names, [id]: name.trim().slice(0, 40) } })),
  // the last arena left on can't be switched off: the draw always needs one
  toggle: (id) => set((s) => (s.off.includes(id) ? { off: s.off.filter((x) => x !== id) } : s.off.length >= ARENAS.length - 1 ? s : { off: [...s.off, id] })),
  addLed: (url) => set((s) => ({ led: [...s.led, url].slice(0, MAX_LED) })),
  removeLed: (i) => set((s) => ({ led: s.led.filter((_, k) => k !== i) })),
  setSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
}), { name: "sabung-arenas", version: 1 }));

// The arena ids in the draw.
export const arenaPool = () => { const off = useArenaSettings.getState().off; return ARENAS.map((a) => a.id).filter((id) => !off.includes(id)); };

// An arena's shown name (the user's, else the default); unknown ids stay as they are.
export function useArenaName() {
  const names = useArenaSettings((s) => s.names);
  return (id: string) => names[id] || ARENAS.find((a) => a.id === id)?.name || id;
}
