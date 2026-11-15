// The Unzure Cup champion waiting to be celebrated, set when its grand final is accepted (one overlay for the whole app).
import { create } from "zustand";

export type Celebration = { champion: string; runnerUp: string; score: string };

export const useCelebration = create<{ now: Celebration | null; show: (c: Celebration) => void; close: () => void }>((set) => ({
  now: null,
  show: (now) => set({ now }),
  close: () => set({ now: null }),
}));
