// Bottom sheet with one space's panels (mobile). Radix handles focus, Esc and screen readers.
import * as Dialog from "@radix-ui/react-dialog";
import type { NavSpace } from "./nav";
import { SpaceLinks } from "./SpaceLinks";

export function NavSheet({ space, onClose }: { space: NavSpace | null; onClose: () => void }) {
  return (
    <Dialog.Root open={space !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg-base/80" />
        <Dialog.Content aria-describedby={undefined} className="animate-rise fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-card border-t border-border bg-bg-raised p-4 pb-[calc(16px+env(safe-area-inset-bottom))] text-text-primary">
          <Dialog.Title className="m-0 mb-3 font-display text-xl">{space?.label}</Dialog.Title>
          {space && <SpaceLinks space={space} label="always" onNavigate={onClose} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
