// A blocker (PRD §14.1): stops the action and names the cause,
// e.g. "Start New Season diblokir: Nugu Cup belum selesai (R6)".
import { Button } from "./Button";
import { Modal } from "./Modal";
import type { Notice } from "./notice";

export function BlockerDialog({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  return (
    <Modal
      open={notice !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Can't continue yet"
      description={notice?.message}
      footer={<Button variant="primary" onClick={onClose}>Got it</Button>}
    />
  );
}
