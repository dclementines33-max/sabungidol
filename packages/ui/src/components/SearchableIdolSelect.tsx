// Type to find an idol, with photo (PRD §9). Full keyboard: arrows move, Enter picks, Esc closes.
// ARIA combobox pattern so screen readers announce the active option.
import { useId, useState } from "react";
import { IdolPhoto } from "./IdolPhoto";
import { RatingBadge } from "./RatingBadge";
import { useIdolLookup } from "./idolSource";

const MAX_SHOWN = 50; // enough to pick from; typing narrows the rest

export function SearchableIdolSelect({ label, idolIds, value, onChange, placeholder = "Cari nama atau group…" }: {
  label: string;
  idolIds: string[];
  value: string | null;
  onChange: (idolId: string | null) => void;
  placeholder?: string;
}) {
  const lookup = useIdolLookup();
  const [query, setQuery] = useState(value ? (lookup(value)?.name ?? "") : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();

  const q = query.trim().toLowerCase();
  const matches = idolIds.filter((idolId) => {
    const idol = lookup(idolId);
    return idol && (!q || idol.name.toLowerCase().includes(q) || (idol.groupName ?? "Soloist").toLowerCase().includes(q));
  }).slice(0, MAX_SHOWN);

  const choose = (idolId: string) => {
    onChange(idolId);
    setQuery(lookup(idolId)?.name ?? "");
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="text-sm text-text-secondary">{label}</label>
      <input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
          if (value !== null) onChange(null); // editing the text drops the old pick
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            choose(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="mt-1 block w-full rounded-control border border-border-strong bg-surface px-3 py-2 placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-accent-gold"
      />
      {open && (
        <ul id={`${id}-list`} role="listbox" aria-label={label} className="absolute z-30 mt-1 max-h-72 w-full list-none overflow-auto rounded-card border border-border bg-bg-raised p-1">
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-text-secondary">Tidak ada idol yang cocok</li>}
          {matches.map((idolId, i) => {
            const idol = lookup(idolId)!;
            return (
              <li
                key={idolId}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                onClick={() => choose(idolId)}
                onMouseEnter={() => setActive(i)}
                className={`${i === active ? "bg-surface-hover" : ""} flex cursor-pointer items-center gap-3 rounded-control px-2 py-1`}
              >
                <IdolPhoto idolId={idolId} size={64} className="w-8" />
                <span className="flex-1">
                  <span className="block">{idol.name}</span>
                  <span className="block text-xs text-text-secondary">{idol.groupName ?? "Soloist"}</span>
                </span>
                <RatingBadge rating={idol.rating} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
