// The links of one space (Play, Wiki or Studio), shared by the rail and the mobile sheet.
// Play also holds the 9 competition panels under an expandable "Kompetisi".
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Trophy } from "lucide-react";
import { COMPETITIONS, type NavItem, type NavSpace } from "./nav";

// label = how a text label shows: always, never (icon only, still read by screen readers), or from 1024 px.
export type LabelMode = "always" | "never" | "wide";
const labelClass = { always: "", never: "sr-only", wide: "sr-only md:not-sr-only" };

function NavLink({ item, label, onNavigate }: { item: NavItem; label: LabelMode; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: true }}
      onClick={onNavigate}
      title={label === "always" ? undefined : item.label}
      className="flex items-center gap-3 rounded-control border-l-2 border-transparent px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright data-[status=active]:border-accent-bright data-[status=active]:bg-surface data-[status=active]:text-text-primary"
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.5} className="shrink-0" />
      <span className={`${labelClass[label]} truncate`}>{item.label}</span>
    </Link>
  );
}

export function SpaceLinks({ space, label, onNavigate }: { space: NavSpace; label: LabelMode; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const [before, after] = space.id === "play" ? [space.items.slice(0, 3), space.items.slice(3)] : [space.items, []];
  return (
    <ul className="m-0 list-none space-y-0.5 p-0">
      {before.map((item) => <li key={item.to}><NavLink item={item} label={label} onNavigate={onNavigate} /></li>)}
      {space.id === "play" && (
        <li>
          <details className="group" open={pathname.startsWith("/play/") || undefined /* show the active competition */}>
            <summary
              title={label === "always" ? undefined : "Kompetisi"}
              className="flex cursor-pointer list-none items-center gap-3 rounded-control px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright"
            >
              <Trophy aria-hidden="true" size={18} strokeWidth={1.5} className="shrink-0" />
              <span className={`${labelClass[label]} flex-1`}>Kompetisi</span>
              <ChevronRight aria-hidden="true" size={14} className={`${label === "never" ? "hidden" : label === "wide" ? "hidden md:block" : ""} transition-transform group-open:rotate-90`} />
            </summary>
            <ul className="m-0 list-none space-y-0.5 p-0 pl-2">
              {COMPETITIONS.map((item) => <li key={item.to}><NavLink item={item} label={label} onNavigate={onNavigate} /></li>)}
            </ul>
          </details>
        </li>
      )}
      {after.map((item) => <li key={item.to}><NavLink item={item} label={label} onNavigate={onNavigate} /></li>)}
    </ul>
  );
}
