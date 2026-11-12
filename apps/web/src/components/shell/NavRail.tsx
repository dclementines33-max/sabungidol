// Left rail (agreed shell): icons only from 640 px, full width from 1024 px unless the user collapsed it.
import { Link } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SPACES } from "./nav";
import { SpaceLinks } from "./SpaceLinks";

export function NavRail({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const label = collapsed ? "never" : "wide";
  return (
    <nav
      aria-label="Navigasi utama"
      className={`${collapsed ? "w-16" : "w-16 md:w-60"} sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r border-border bg-bg-raised px-2 py-4 sm:flex`}
    >
      <Link to="/" className="mb-6 block px-3 font-display text-xl text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright">
        <span className={collapsed ? "" : "md:hidden"} aria-hidden="true">SI</span>
        <span className={collapsed ? "sr-only" : "sr-only md:not-sr-only"}>Sabung Idol</span>
      </Link>
      <div className="flex-1 space-y-6">
        {SPACES.map((space) => (
          <section key={space.id} aria-labelledby={`rail-${space.id}`}>
            <h2 id={`rail-${space.id}`} className={`${collapsed ? "sr-only" : "sr-only md:not-sr-only"} m-0 mb-1 block px-3 text-xs tracking-wide text-text-secondary uppercase`}>
              {space.label}
            </h2>
            <SpaceLinks space={space} label={label} />
          </section>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={collapsed}
        className="mt-4 hidden items-center gap-3 rounded-control px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright md:flex"
      >
        {collapsed ? <PanelLeftOpen aria-hidden="true" size={18} strokeWidth={1.5} /> : <PanelLeftClose aria-hidden="true" size={18} strokeWidth={1.5} />}
        <span className={collapsed ? "sr-only" : ""}>Ciutkan menu</span>
      </button>
    </nav>
  );
}
