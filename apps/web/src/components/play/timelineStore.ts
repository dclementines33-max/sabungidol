// The highlights of the last bulk play, waiting to be shown in the Simulation Timeline (one popup for the whole app).
import type { Highlight } from "@sabung/engine";
import { create } from "zustand";

export const useSimTimeline = create<{ items: Highlight[] | null; show: (items: Highlight[]) => void; close: () => void }>((set) => ({
  items: null,
  show: (items) => set({ items }),
  close: () => set({ items: null }),
}));
