// Compact first, full view on demand (2026-11-17 compact + expand pass): renders children(open) and, when there is more
// to show, one button that toggles it ("Show less" once open). The caller decides what the compact view leaves out.
import { type ReactNode, useState } from "react";

export function ShowMore({ more, label, children }: { more: boolean; label: string; children: (open: boolean) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {children(open)}
      {more && (
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="mt-3 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright">
          {open ? "Show less" : label}
        </button>
      )}
    </>
  );
}
