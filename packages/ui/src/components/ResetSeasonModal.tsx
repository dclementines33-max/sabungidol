// Reset a season (PRD §9): says exactly what will be deleted, offers a redraw, needs the season name typed.
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export function ResetSeasonModal({ open, onOpenChange, seasonName, matchCount, competitionCount, onReset }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonName: string;
  matchCount: number;
  competitionCount: number;
  onReset: (options: { redraw: boolean }) => void;
}) {
  const [redraw, setRedraw] = useState(false);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Reset ${seasonName}?`}
      message={`${matchCount.toLocaleString("id-ID")} match dari ${competitionCount} kompetisi akan dihapus. Ini tidak bisa dibatalkan.`}
      confirmLabel="Reset season"
      danger
      typeToConfirm={seasonName}
      onConfirm={() => onReset({ redraw })}
    >
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={redraw} onChange={(e) => setRedraw(e.target.checked)} className="size-4 accent-accent-bright" />
        Undi ulang grup dan bracket
      </label>
    </ConfirmDialog>
  );
}
