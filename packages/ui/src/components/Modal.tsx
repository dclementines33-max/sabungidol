// The frame every dialog shares. Radix handles focus trapping, Esc and screen reader labels.
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function Modal({ open, onOpenChange, title, description, footer, children, onOpenAutoFocus, className = "max-w-lg" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
  onOpenAutoFocus?: (event: Event) => void;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg-base/80" />
        <Dialog.Content
          onOpenAutoFocus={onOpenAutoFocus}
          {...(description ? {} : { "aria-describedby": undefined })} // no description: tell Radix not to link one
          className={`${className} fixed top-1/2 left-1/2 max-h-[90vh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-card border border-border bg-bg-raised p-6 text-text-primary`}
        >
          <Dialog.Title className="m-0 font-display text-xl">{title}</Dialog.Title>
          {description && <Dialog.Description className="m-0 mt-2 text-sm text-text-secondary">{description}</Dialog.Description>}
          <div className="mt-4">{children}</div>
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
