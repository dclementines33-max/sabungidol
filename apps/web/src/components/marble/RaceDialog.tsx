// The whole-screen race as a dialog (focus, Esc and a screen-reader title stay right, also over the match dialog).
// The 3D stage is lazy-loaded, so three + Rapier download only when a race opens. A new `run` starts a fresh race.
import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode, Suspense, lazy } from "react";
import type { RaceOptions, RaceSnapshot } from "../../marble/controller";

const MarbleStage = lazy(() => import("./MarbleStage"));

export function RaceDialog({ open, onOpenChange, label, title, run, options, actions }: {
  open: boolean; onOpenChange: (open: boolean) => void; label: string; title: string; run: number;
  options: RaceOptions; actions: (s: RaceSnapshot) => ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-50">
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          {open && (
            <Suspense fallback={<p className="score fixed inset-0 m-0 grid place-items-center bg-bg-base text-xl">Loading the arena…</p>}>
              <MarbleStage key={run} title={title} options={options} actions={actions} onLeave={() => onOpenChange(false)} />
            </Suspense>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
