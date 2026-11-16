// The timelines of the last bulk play, waiting to be shown in the Simulation Timeline (one popup for the whole app).
import type { Timeline } from "@sabung/engine";
import { create } from "zustand";

export const useSimTimeline = create<{ items: Timeline[] | null; show: (items: Timeline[]) => void; close: () => void }>((set) => ({
  items: null,
  show: (items) => set({ items }),
  close: () => set({ items: null }),
}));
