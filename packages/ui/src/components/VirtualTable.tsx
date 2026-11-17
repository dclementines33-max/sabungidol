// A table that only renders the rows in view (PRD §13: 240 idols / 10,000 matches at 60 fps).
// Rows have one fixed height; spacer rows keep the scrollbar the size of the whole list.
import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactNode, useRef } from "react";

export type Column<Row> = { header: string; cell: (row: Row) => ReactNode; className?: string };

export function VirtualTable<Row>({ rows, columns, rowKey, label, rowHeight = 48, height = "70vh" }: {
  rows: Row[];
  columns: Column<Row>[];
  rowKey: (row: Row) => string;
  label: string;
  rowHeight?: number;
  height?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const virtual = useVirtualizer({ count: rows.length, getScrollElement: () => scroller.current, estimateSize: () => rowHeight, overscan: 10, initialRect: { width: 0, height: 800 } });
  const items = virtual.getVirtualItems();
  const top = items[0]?.start ?? 0;
  const bottom = virtual.getTotalSize() - (items.at(-1)?.end ?? 0);
  return (
    <div ref={scroller} style={{ maxHeight: height }} className="overflow-auto panel" tabIndex={0} role="region" aria-label={label}>
      <table className="w-full border-collapse text-sm" aria-rowcount={rows.length + 1}>
        <thead className="sticky top-0 z-10 bg-stage shadow-[inset_0_-2px_0_var(--color-accent-bright)]">
          <tr>{columns.map((c) => <th key={c.header} scope="col" className={`px-3 py-2.5 text-left text-[10px] font-extrabold tracking-[0.18em] text-text-secondary uppercase ${c.className ?? ""}`}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {top > 0 && <tr aria-hidden="true" style={{ height: top }} />}
          {items.map((item) => {
            const row = rows[item.index]!;
            return (
              <tr key={rowKey(row)} aria-rowindex={item.index + 2} style={{ height: rowHeight }} className="odd:bg-stage-hi/40 hover:bg-surface-hover/70">
                {columns.map((c) => <td key={c.header} className={`px-3 ${c.className ?? ""}`}>{c.cell(row)}</td>)}
              </tr>
            );
          })}
          {bottom > 0 && <tr aria-hidden="true" style={{ height: bottom }} />}
        </tbody>
      </table>
    </div>
  );
}
