// Every panel the shell links to (PRD §8), in the order the agreed shell shows them.
// phase = the PRD §15 phase that builds the panel; until then it shows a placeholder.
import {
  Archive, ChartColumn, Crown, Database, FilePlus2, Gauge, GitCompareArrows, House, LayoutDashboard, Medal,
  Newspaper, Settings, Swords, Trophy, UserRoundX, Users, UsersRound, type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; to: string; icon: LucideIcon; phase: number };
export type NavSpace = { id: "play" | "wiki" | "studio"; label: string; items: NavItem[] };

// The 9 competition panels (PRD §8). Liga Divisi 1/2 each hold their six leagues as tabs.
export const COMPETITIONS: NavItem[] = [
  ["Liga Divisi 1", "d1"], ["Liga Divisi 2", "d2"], ["The Idols", "the-idols"], ["Unzure Cup", "unzure"],
  ["Inkigayo Cup", "inkigayo"], ["Nugu Cup", "nugu"], ["B-Side Cup", "b-side"], ["Daesang Cup", "daesang"], ["Music Bank Cup", "music-bank"],
].map(([label, slug]) => ({ label, to: `/play/${slug}`, icon: Trophy, phase: 3 }));

export const SPACES: NavSpace[] = [
  {
    id: "play",
    label: "Play",
    items: [
      { label: "Home", to: "/", icon: House, phase: 4 },
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, phase: 4 },
      { label: "Sabung Idol", to: "/play", icon: Swords, phase: 3 },
      { label: "Season Story", to: "/story", icon: Newspaper, phase: 4 },
    ],
  },
  {
    id: "wiki",
    label: "Wiki",
    items: [
      { label: "Idol Database", to: "/wiki/idols", icon: Users, phase: 2 },
      { label: "Girl Group Stats", to: "/wiki/groups", icon: UsersRound, phase: 4 },
      { label: "Career Stats", to: "/wiki/career", icon: ChartColumn, phase: 4 },
      { label: "Head to Head", to: "/wiki/h2h", icon: GitCompareArrows, phase: 4 },
      { label: "Hall of Champions", to: "/wiki/champions", icon: Crown, phase: 4 },
      { label: "All-time Records", to: "/wiki/records", icon: Medal, phase: 4 },
      { label: "Match Database", to: "/wiki/matches", icon: Database, phase: 4 },
      { label: "Season Archive", to: "/wiki/seasons", icon: Archive, phase: 4 },
    ],
  },
  {
    id: "studio",
    label: "Studio",
    items: [
      { label: "Input Data", to: "/studio/input", icon: FilePlus2, phase: 2 },
      { label: "Rating Manager", to: "/studio/ratings", icon: Gauge, phase: 3 },
      { label: "Inactive Manager", to: "/studio/inactive", icon: UserRoundX, phase: 2 },
      { label: "Settings", to: "/studio/settings", icon: Settings, phase: 2 },
    ],
  },
];

const ALL = [...SPACES.flatMap((s) => s.items), ...COMPETITIONS];

// The panel a path belongs to; an idol's own page is not in the menu.
export function panelFor(pathname: string): NavItem | undefined {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path.startsWith("/wiki/idols/")) return { label: "Idol Profile", to: path, icon: Users, phase: 4 };
  if (path === "/dev/worker") return { label: "Uji Worker", to: path, icon: Gauge, phase: 1 }; // Fase 1 checks, not in the menu
  if (path === "/dev/notices") return { label: "Uji Notifikasi", to: path, icon: Gauge, phase: 1 };
  return ALL.find((item) => item.to === path);
}

export const spaceOf = (pathname: string) =>
  SPACES.find((s) => s.items.some((i) => i.to === pathname) || (s.id === "play" && pathname.startsWith("/play")))?.id
  ?? (pathname.startsWith("/wiki") ? "wiki" : pathname.startsWith("/studio") ? "studio" : "play");
