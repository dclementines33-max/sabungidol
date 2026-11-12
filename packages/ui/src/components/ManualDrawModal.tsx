// ManualGroupModal / ManualBracketModal (PRD §9): move idols between Unzure groups or round-of-32
// slots before the stage starts. The caller's check re-validates §5.7–5.8; problems block Apply.
import type { DrawCheck } from "@sabung/engine";
import { useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { SwapBoard } from "./SwapBoard";

function ManualDrawModal({ open, onOpenChange, title, labels, initial, check, onApply }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  labels: string[];
  initial: string[][];
  check: (columns: string[][]) => DrawCheck;
  onApply: (columns: string[][]) => void;
}) {
  const [columns, setColumns] = useState(initial);
  const { problems, warnings } = check(columns);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Pilih dua idol (klik atau Enter) atau seret satu ke yang lain untuk menukar posisi."
      className="max-w-5xl"
      footer={
        <>
          <Button onClick={() => setColumns(initial)}>Kembalikan</Button>
          <Button onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="primary" disabled={problems.length > 0} onClick={() => { onApply(columns); onOpenChange(false); }}>Apply</Button>
        </>
      }
    >
      <SwapBoard labels={labels} columns={columns} onChange={setColumns} />
      <div role="status" className="mt-4 text-sm">
        {problems.length === 0 && warnings.length === 0 && <p className="m-0 text-accent-sage">Semua aturan terpenuhi.</p>}
        {problems.length > 0 && <ul className="m-0 pl-5 text-danger">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
        {warnings.length > 0 && <ul className="m-0 pl-5 text-accent-gold">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
      </div>
    </Modal>
  );
}

type Props = { open: boolean; onOpenChange: (open: boolean) => void; check: (columns: string[][]) => DrawCheck };
const LETTERS = "ABCDEFGHIJKLMNOP";

export function ManualGroupModal({ groups, onApply, ...props }: Props & { groups: string[][]; onApply: (groups: string[][]) => void }) {
  return <ManualDrawModal {...props} title="Atur grup Unzure Cup" labels={groups.map((_, g) => `Grup ${LETTERS[g]}`)} initial={groups} onApply={onApply} />;
}

export function ManualBracketModal({ pairs, onApply, ...props }: Props & { pairs: [string, string][]; onApply: (pairs: [string, string][]) => void }) {
  return (
    <ManualDrawModal
      {...props}
      title="Atur bracket babak 32"
      labels={pairs.map((_, i) => `Match ${i + 1}`)}
      initial={pairs}
      onApply={(columns) => onApply(columns as [string, string][])}
    />
  );
}
