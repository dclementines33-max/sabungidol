// The frame every dialog shares. Radix handles focus trapping, Esc and screen reader labels. full = the whole screen on
// an opaque backdrop (simulation results: nothing behind may give the result away); className then sizes the column.
// Design round 2 (Fight Night): every dialog stands on a spotlit stage (.stage) with a crimson slash title; a full-screen
// one opens like a broadcast ("on air" strip, the title huge).
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
      {full && <p aria-hidden="true" className="kicker m-0 mb-3 flex items-center gap-2 text-accent-bright">Sabung Idol · On air <span className="size-2 rounded-full bg-accent-bright motion-safe:animate-pulse" /></p>}
      <Dialog.Title className={`section-title ${full ? "text-headline" : "text-xl"}`}>{title}</Dialog.Title>
      {description && <Dialog.Description className="m-0 mt-2 text-sm text-text-secondary">{description}</Dialog.Description>}
      <div className={full ? "mt-6" : "mt-4"}>{children}</div>
      {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
    </>
  );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={full ? "fixed inset-0 z-40 bg-bg-base" : "fixed inset-0 bg-[radial-gradient(60rem_40rem_at_50%_40%,rgb(125_0_24/0.35),rgb(1_0_3/0.88))] backdrop-blur-sm"} />
        <Dialog.Content
          onOpenAutoFocus={onOpenAutoFocus}
          {...(description ? {} : { "aria-describedby": undefined })} // no description: tell Radix not to link one
          className={full ? "fixed inset-0 z-40 overflow-auto bg-bg-base text-text-primary" : `${className} stage fixed top-1/2 left-1/2 max-h-[90vh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-card p-6 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.95),0_0_0_1px_rgb(255_77_99/0.18),inset_0_3px_0_var(--color-accent-bright)] text-text-primary`}
        >
          {full ? (
            <>
              <div aria-hidden="true" className="stage pointer-events-none fixed inset-0" />
              <div className={`${className} relative mx-auto px-4 py-6 sm:px-8 sm:py-10`}>{inner}</div>
            </>
          ) : inner}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
