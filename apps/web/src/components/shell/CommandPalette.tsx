// Ctrl/Cmd + K (PRD §8): type to jump to a panel or run a command. Full keyboard: arrows move,
// Enter runs, Esc closes. Full screen on mobile (the Search button), a centred box from 640 px.
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { filterItems, type PaletteItem, paletteItems } from "./paletteItems";

export function CommandPalette({ open, onOpenChange, onCommand }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommand: (command: string) => void;
}) {
  const navigate = useNavigate();
  const items = useMemo(paletteItems, []);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const results = filterItems(items, query);

  useEffect(() => {
    document.getElementById(`${id}-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, id]);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setActive(0);
  };
  const run = (item: PaletteItem) => {
    close();
    if (item.to) navigate({ to: item.to });
    else if (item.command) onCommand(item.command);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg-base/80" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-bg-raised text-text-primary sm:inset-auto sm:top-[10vh] sm:left-1/2 sm:max-h-[70vh] sm:w-[min(560px,calc(100%-32px))] sm:-translate-x-1/2 sm:rounded-card sm:border sm:border-border"
        >
          <Dialog.Title className="sr-only">Search panels or commands</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search aria-hidden="true" size={18} strokeWidth={1.5} className="text-text-secondary" />
            <input
              role="combobox"
              aria-label="Search panels or commands"
              aria-expanded
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={results[active] ? `${id}-${active}` : undefined}
              value={query}
              placeholder="Search panels or commands…"
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter" && results[active]) {
                  e.preventDefault();
                  run(results[active]);
                }
              }}
              className="w-full bg-transparent py-4 text-base placeholder:text-text-secondary focus:outline-none"
            />
          </div>
          <ul id={`${id}-list`} role="listbox" aria-label="Results" className="m-0 flex-1 list-none overflow-y-auto p-2">
            {results.map((item, i) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                  onClick={() => run(item)}
                  onMouseMove={() => setActive(i)}
                  className={`${i === active ? "bg-surface-hover" : ""} flex cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-sm`}
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={1.5} className="shrink-0 text-text-secondary" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="text-xs text-text-secondary">{item.group}</span>
                </li>
              );
            })}
          </ul>
          {results.length === 0 && <p className="m-0 px-4 pb-4 text-sm text-text-secondary">No results for “{query.trim()}”.</p>}
          <p className="m-0 border-t border-border px-4 py-2 text-xs text-text-secondary">
            Idol and group search arrives once idol data is in.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
