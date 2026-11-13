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
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg-base px-4 py-3 md:px-8">
      <h1 className="m-0 min-w-0 flex-1 truncate font-display text-xl md:text-2xl">{panelFor(pathname)?.label ?? "Tidak ditemukan"}</h1>
      <span className="hidden rounded-control bg-surface-hover/60 px-2 py-0.5 text-xs text-text-secondary sm:inline" data-testid="season-chip">
        {season ? `${season.name} · ${season.status === "draft" ? "Draft" : season.status}` : "Belum ada season"}
      </span>
      <button
        type="button"
        onClick={onSearch}
        disabled={!onSearch}
        className="hidden items-center gap-2 rounded-control bg-surface-hover/60 px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright disabled:opacity-50 sm:flex"
      >
        <Search aria-hidden="true" size={16} strokeWidth={1.5} />
        Cari…
        <kbd className="font-mono text-xs">Ctrl K</kbd>
      </button>
      <NotificationCenter notices={notices} unread={unread} onOpen={markRead} onExport={exportNotices} />
    </header>
  );
}
