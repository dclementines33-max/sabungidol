// Top of the content area (agreed shell): page title, season chip, search, notifications.
import { NotificationCenter } from "@sabung/ui";
import { useLocation } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { exportNotices, useNotices } from "../../data/notices";
import { useCurrentSeason } from "../../data/seasonQuery";
import { panelFor } from "./nav";

export function Header({ onSearch }: { onSearch?: () => void }) {
  const { pathname } = useLocation();
  const notices = useNotices((s) => s.notices);
  const unread = useNotices((s) => s.unread);
  const markRead = useNotices((s) => s.markRead);
  const season = useCurrentSeason();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-bg-base/90 px-4 py-3 shadow-[0_1px_0_rgb(255_77_99/0.2),0_12px_30px_-18px_black] backdrop-blur md:px-8">
      <h1 className="section-title min-w-0 flex-1 truncate text-xl md:text-2xl">{panelFor(pathname)?.label ?? "Not found"}</h1>
      <span className="hidden rounded-control bg-surface-hover/60 px-2 py-0.5 text-xs text-text-secondary sm:inline" data-testid="season-chip">
        {season ? `${season.name} · ${season.status === "draft" ? "Draft" : season.status}` : "No season yet"}
      </span>
      <button
        type="button"
        onClick={onSearch}
        disabled={!onSearch}
        className="hidden items-center gap-2 rounded-control bg-surface-hover/60 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright disabled:opacity-50 sm:flex"
      >
        <Search aria-hidden="true" size={16} strokeWidth={1.5} />
        Search…
        <kbd className="font-mono text-xs">Ctrl K</kbd>
      </button>
      <NotificationCenter notices={notices} unread={unread} onOpen={markRead} onExport={exportNotices} />
    </header>
  );
}
