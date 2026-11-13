// Bell with the history of every notification (PRD §14.1): filter by level, export.
import { Bell } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "./Button";
import { LEVEL, type Notice, type NoticeLevel } from "./notice";

export function NotificationCenter({ notices, unread, onOpen, onExport }: {
  notices: Notice[];
  unread: number;
  onOpen?: () => void;
  onExport: (shown: Notice[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<NoticeLevel | "all">("all");
  const panelId = useId();
  const shown = [...notices].filter((n) => level === "all" || n.level === level).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        onClick={() => {
          setOpen(!open);
          if (!open) onOpen?.();
        }}
        className="relative rounded-control p-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright"
      >
        <Bell aria-hidden="true" size={20} strokeWidth={1.5} />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-accent-bright px-1 font-mono text-xs text-on-fill tabular-nums">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <section id={panelId} aria-label="Riwayat notifikasi" className="absolute right-0 z-40 mt-2 w-[min(400px,calc(100vw-32px))] panel p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <label className="flex-1 text-sm text-text-secondary">
              Level{" "}
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as NoticeLevel | "all")}
                className="ml-1 rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-2 py-1 text-text-primary"
              >
                <option value="all">Semua</option>
                {Object.entries(LEVEL).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <Button className="px-2 py-1" onClick={() => onExport(shown)}>Ekspor</Button>
          </div>
          {shown.length === 0 ? (
            <p className="m-0 mt-4 text-sm text-text-secondary">Belum ada notifikasi.</p>
          ) : (
            <ul className="m-0 mt-4 max-h-80 list-none space-y-2 overflow-auto p-0">
              {shown.map((n) => {
                const { color, icon: Icon } = LEVEL[n.level];
                return (
                  <li key={n.id} className="flex gap-2 text-sm">
                    <Icon aria-label={LEVEL[n.level].label} size={16} strokeWidth={1.5} className={`${color} mt-0.5 shrink-0`} />
                    <span className="flex-1">
                      {n.code && <span className="font-mono text-text-secondary">{n.code} · </span>}
                      {n.message}
                    </span>
                    <time dateTime={n.at} className="font-mono text-xs text-text-secondary tabular-nums">{n.at.slice(11, 16)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
