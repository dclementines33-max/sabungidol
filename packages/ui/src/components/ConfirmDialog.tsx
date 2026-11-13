// Standard confirmation (PRD §9): focus starts on Cancel; dangerous actions are red and can require
// typing a word before the confirm button works.
import { type ReactNode, useRef, useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({ open, onOpenChange, title, message, confirmLabel, onConfirm, danger = false, typeToConfirm, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
  typeToConfirm?: string;
  children?: ReactNode;
}) {
  const [typed, setTyped] = useState("");
  const cancel = useRef<HTMLButtonElement>(null);
  const close = (next: boolean) => {
    if (!next) setTyped("");
    onOpenChange(next);
  };
  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={title}
      description={message}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        cancel.current?.focus();
      }}
      footer={
        <>
          <Button ref={cancel} onClick={() => close(false)}>Batal</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={typeToConfirm !== undefined && typed !== typeToConfirm}
            onClick={() => {
              onConfirm();
              close(false);
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {typeToConfirm !== undefined && (
        <label className="mt-4 block text-sm">
          Ketik <strong className="font-mono">{typeToConfirm}</strong> untuk konfirmasi
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-2 block w-full rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-3 py-2 font-mono focus-visible:outline-2 focus-visible:outline-accent-bright"
          />
        </label>
      )}
    </Modal>
  );
}
