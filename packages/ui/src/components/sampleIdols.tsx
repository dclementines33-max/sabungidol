// Sample idols for Storybook and component tests (no database in packages/ui).
import type { ReactNode } from "react";
import { type IdolInfo, IdolSourceProvider } from "./idolSource";

export const SAMPLE_IDOLS: IdolInfo[] = [
  { id: "mina", name: "Mina Kim", groupName: "Aurora", groupColor: "brand-rose", rating: 92, form: "On Fire", recent: ["W", "W", "W", "W", "W"], titles: 7 },
  { id: "yuna", name: "Yuna", groupName: "Aurora", groupColor: "brand-rose", rating: 84, form: "Hot Streak", recent: ["W", "D", "W", "W", "W"], titles: 2 },
  { id: "sora", name: "Han Sora", groupName: "Velvet Nine", groupColor: "brand-indigo", rating: 76, form: "Steady", recent: ["W", "L", "D", "L", "W"] },
  { id: "jiwoo", name: "Jiwoo Park", groupName: null, rating: 64, form: "Cold Slump", recent: ["L", "L", "D", "L", "W"] },
  { id: "rina", name: "Rina", groupName: "Velvet Nine", groupColor: "brand-indigo", rating: 55, form: "Confident", recent: ["W", "W", "L", "D", "W"], active: false },
];

const byId = new Map(SAMPLE_IDOLS.map((idol) => [idol.id, idol]));

export function SampleIdols({ children, photos = {} }: { children: ReactNode; photos?: Record<string, string> }) {
  return <IdolSourceProvider source={{ idol: (id) => byId.get(id), photo: (id) => photos[id] }}>{children}</IdolSourceProvider>;
}
