// Career Stats → the top three of a tab as a podium (Update 2): torn photos, the middle one raised, the value in
// blackletter.
import type { CareerRow } from "@sabung/engine";
import { IdolPhoto } from "@sabung/ui";
import type { ReactNode } from "react";
import { IdolLink } from "../wiki/IdolLink";

const ORDER = [1, 0, 2]; // second, first, third

export function Podium({ rows, column }: { rows: CareerRow[]; column: { header: string; value: (r: CareerRow) => ReactNode } }) {
  if (rows.length === 0) return null;
  return (
    <ol aria-label={`Top three · ${column.header}`} className="m-0 flex list-none items-end gap-4 p-0 sm:gap-8">
      {ORDER.filter((i) => rows[i]).map((i) => {
        const r = rows[i]!;
        return (
          <li key={r.idolId} className={`flex flex-col items-center text-center ${i === 0 ? "-translate-y-6" : ""}`}>
            <span aria-hidden="true" className="font-gothic text-3xl text-accent-bright">{i + 1}</span>
            <IdolPhoto idolId={r.idolId} size={256} className={`photo-frame ${i === 0 ? "w-32 sm:w-40" : "w-24 sm:w-28"}`} />
            <IdolLink id={r.idolId} className="mt-1 max-w-32 truncate font-display" />
            <span className="kicker text-text-secondary">{column.header}</span>
            <span className="font-display text-2xl tabular-nums">{column.value(r)}</span>
          </li>
        );
      })}
    </ol>
  );
}
