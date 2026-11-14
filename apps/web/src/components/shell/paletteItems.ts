// What the command palette can find (PRD §8): every panel, the 9 competitions, and the commands
// that exist so far. Idols, groups and season commands join when their data exists (Fase 2–3).
import { type LucideIcon, PanelLeft, CheckCheck } from "lucide-react";
import { COMPETITIONS, SPACES } from "./nav";

export type PaletteItem = { id: string; label: string; group: string; icon: LucideIcon; to?: string; command?: string };

export function paletteItems(): PaletteItem[] {
  const panels = SPACES.flatMap((space) =>
    space.items.map((item) => ({ id: item.to, label: item.label, group: space.label, icon: item.icon, to: item.to })));
  const competitions = COMPETITIONS.map((item) => ({ id: item.to, label: item.label, group: "Competitions", icon: item.icon, to: item.to }));
  const commands = [
    { id: "cmd:rail", label: "Collapse or expand the menu", group: "Commands", icon: PanelLeft, command: "toggle-rail" },
    { id: "cmd:read", label: "Mark all notifications read", group: "Commands", icon: CheckCheck, command: "mark-read" },
  ];
  return [...panels, ...competitions, ...commands];
}

// Case-insensitive; a label that starts with the query comes before one that only contains it.
// The group name also matches, so "wiki" lists every Wiki panel.
export function filterItems(items: PaletteItem[], query: string): PaletteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const rank = (item: PaletteItem) => {
    const label = item.label.toLowerCase();
    if (label.startsWith(q)) return 0;
    if (label.split(/\s+/).some((word) => word.startsWith(q))) return 1;
    if (label.includes(q)) return 2;
    if (item.group.toLowerCase().includes(q)) return 3;
    return -1;
  };
  return items
    .map((item, index) => ({ item, index, rank: rank(item) }))
    .filter((x) => x.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((x) => x.item);
}
