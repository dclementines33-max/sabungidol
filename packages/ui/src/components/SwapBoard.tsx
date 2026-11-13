// Columns of idols where any two can swap places: pick one then another (click or Enter),
// or drag one onto another. Swapping keeps every column's size. Shared by the Manual modals.
import { useState } from "react";
import { IdolPhoto } from "./IdolPhoto";
import { useIdolLookup } from "./idolSource";

type Spot = { column: number; row: number };

export function swap(columns: string[][], a: Spot, b: Spot): string[][] {
  const next = columns.map((c) => [...c]);
  [next[a.column][a.row], next[b.column][b.row]] = [columns[b.column][b.row], columns[a.column][a.row]];
  return next;
}

export function SwapBoard({ labels, columns, onChange }: {
  labels: string[];
  columns: string[][];
  onChange: (columns: string[][]) => void;
}) {
  const lookup = useIdolLookup();
  const [picked, setPicked] = useState<Spot | null>(null);
  const same = (a: Spot | null, b: Spot) => a?.column === b.column && a.row === b.row;

  const choose = (spot: Spot) => {
    if (!picked) return setPicked(spot);
    if (!same(picked, spot)) onChange(swap(columns, picked, spot));
    setPicked(null);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {columns.map((ids, column) => (
        <section key={labels[column]} aria-label={labels[column]} className="panel bg-surface p-2">
          <h3 className="m-0 mb-1 text-sm text-text-secondary">{labels[column]}</h3>
          {ids.map((id, row) => {
            const spot = { column, row };
            const name = lookup(id)?.name ?? id;
            return (
              <button
                key={id}
                type="button"
                draggable
                aria-pressed={same(picked, spot)}
                aria-label={picked && !same(picked, spot) ? `Tukar dengan ${name}` : `Pilih ${name}`}
                onClick={() => choose(spot)}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify(spot))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = JSON.parse(e.dataTransfer.getData("text/plain")) as Spot;
                  if (!same(from, spot)) onChange(swap(columns, from, spot));
                  setPicked(null);
                }}
                className={`${same(picked, spot) ? "bg-surface-hover outline-2 outline-accent-bright" : ""} flex w-full cursor-grab items-center gap-2 rounded-control px-1 py-1 text-left text-sm hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright`}
              >
                <IdolPhoto idolId={id} size={64} className="w-6" />
                <span className="truncate">{name}</span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}
