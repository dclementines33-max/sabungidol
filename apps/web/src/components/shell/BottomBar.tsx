// Mobile bottom bar (agreed shell, below 640 px): Home, Play, Wiki, Search, Studio.
// Play / Wiki / Studio open a sheet with that space's panels.
import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, House, Search, Swords, Wrench } from "lucide-react";
import { useState } from "react";
import { type NavSpace, SPACES, spaceOf } from "./nav";
import { NavSheet } from "./NavSheet";

const ICON = { play: Swords, wiki: BookOpen, studio: Wrench };
const item = "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs focus-visible:outline-2 focus-visible:outline-accent-bright";

export function BottomBar({ onSearch }: { onSearch?: () => void }) {
  const { pathname } = useLocation();
  const [sheet, setSheet] = useState<NavSpace | null>(null);
  const current = pathname === "/" ? "home" : spaceOf(pathname);
  const color = (id: string) => (current === id ? "text-accent-bright" : "text-text-secondary");
  const spaceButton = (space: NavSpace) => {
    const Icon = ICON[space.id];
    return (
      <button type="button" className={`${item} ${color(space.id)}`} aria-haspopup="dialog" onClick={() => setSheet(space)}>
        <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
        {space.label}
      </button>
    );
  };
  const [play, wiki, studio] = SPACES;
  return (
    <>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg-raised pb-[env(safe-area-inset-bottom)] sm:hidden">
        <Link to="/" className={`${item} ${color("home")}`} activeOptions={{ exact: true }}>
          <House aria-hidden="true" size={20} strokeWidth={1.5} />
          Home
        </Link>
        {spaceButton(play)}
        {spaceButton(wiki)}
        <button type="button" className={`${item} text-text-secondary disabled:opacity-50`} onClick={onSearch} disabled={!onSearch}>
          <Search aria-hidden="true" size={20} strokeWidth={1.5} />
          Search
        </button>
        {spaceButton(studio)}
      </nav>
      <NavSheet space={sheet} onClose={() => setSheet(null)} />
    </>
  );
}
