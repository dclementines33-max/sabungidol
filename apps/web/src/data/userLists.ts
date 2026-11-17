// The user's own lists (2026-11-17): My Top 10 (Ranking) and tier lists, per kind (idols or girl groups). Kept in this
// browser's storage; read after mount (rehydrate) so the prerendered HTML and the first client render agree.
// shortcut: not in backups or cloud sync, and not shared across devices; move into the database + backup sections if
// the user wants them on another device.
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Kind = "idol" | "group";
export type TierRow = { id: string; label: string; color: string };
export type TierList = { id: string; name: string; kind: Kind; tiers: TierRow[]; placed: Record<string, string[]>; updated: number };

type State = {
  top10: Record<Kind, string[]>;
  lists: TierList[];
  setTop10: (kind: Kind, ids: string[]) => void;
  saveList: (list: TierList) => void;
  removeList: (id: string) => void;
};

export const useUserLists = create<State>()(persist((set) => ({
  top10: { idol: [], group: [] },
  lists: [],
  setTop10: (kind, ids) => set((s) => ({ top10: { ...s.top10, [kind]: ids.slice(0, 10) } })),
  saveList: (list) => set((s) => {
    const next = { ...list, updated: Date.now() };
    return { lists: s.lists.some((l) => l.id === list.id) ? s.lists.map((l) => (l.id === list.id ? next : l)) : [...s.lists, next] };
  }),
  removeList: (id) => set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })),
}), { name: "sabung-user-lists", version: 1, skipHydration: true }));

// True once the saved lists are loaded (storage blocked = empty lists, still true).
export function useListsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve(useUserLists.persist.rehydrate()).catch(() => undefined).finally(() => setReady(true));
  }, []);
  return ready;
}
