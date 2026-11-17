// The frame every dialog shares. Radix handles focus trapping, Esc and screen reader labels. full = the whole screen on
// an opaque backdrop (simulation results: nothing behind may give the result away); className then sizes the column.
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function Modal({ open, onOpenChange, title, description, footer, children, onOpenAutoFocus, className = "max-w-lg", full = false }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
  onOpenAutoFocus?: (event: Event) => void;
  className?: string;
  full?: boolean;
}) {
  const inner = (
    <>
      <Dialog.Title className="m-0 font-display text-xl">{title}</Dialog.Title>
      {description && <Dialog.Description className="m-0 mt-2 text-sm text-text-secondary">{description}</Dialog.Description>}
      <div className="mt-4">{children}</div>
      {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
    </>
  );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={full ? "fixed inset-0 z-40 bg-bg-base" : "fixed inset-0 bg-bg-base/80 backdrop-blur-sm"} />
        <Dialog.Content
          onOpenAutoFocus={onOpenAutoFocus}
          {...(description ? {} : { "aria-describedby": undefined })} // no description: tell Radix not to link one
          className={full ? "fixed inset-0 z-40 overflow-auto bg-bg-base text-text-primary" : `${className} fixed top-1/2 left-1/2 max-h-[90vh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-card border-t-2 border-accent bg-bg-raised p-6 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.95)] text-text-primary`}
        >
          {full ? <div className={`${className} mx-auto px-4 py-6 sm:px-8`}>{inner}</div> : inner}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
