// Fase 1 check (not in the menu): fire one notification of each level (PRD §14.1) and see where
// it lands, and that the bell keeps the history after a reload (event_log).
import { Button } from "@sabung/ui";
import { createFileRoute } from "@tanstack/react-router";
import { notify } from "../../data/notices";

export const Route = createFileRoute("/dev/notices")({ component: NoticeCheck });

const SAMPLES = [
  { label: "Info", fire: () => notify({ level: "info", message: "Matchday 12 selesai di 13 liga" }) },
  { label: "Success + Undo", fire: () => notify({ level: "success", message: "240 idol ditambahkan", undo: () => notify({ level: "info", message: "Dibatalkan" }) }) },
  { label: "Warning", fire: () => notify({ level: "warning", code: "W-ROSTER-001", message: "Mina ada di Liga D1-A dan D2-C" }) },
  { label: "Blocker", fire: () => notify({ level: "blocker", code: "B-SEASON-001", message: "Start New Season diblokir: Nugu Cup belum selesai (R6)" }) },
  { label: "Error", fire: () => notify({ level: "error", code: "E-DRAW-002", message: "Grup H hanya 3 idol", context: "Unzure Cup · group draw" }) },
];

function NoticeCheck() {
  return (
    <div className="max-w-xl space-y-4">
      <p className="m-0 text-text-secondary">
        Kirim satu notifikasi per level. Info dan success jadi toast, warning dan error tersemat di atas konten,
        blocker jadi dialog, dan semuanya masuk ke lonceng — juga setelah halaman dimuat ulang.
      </p>
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s) => <Button key={s.label} onClick={s.fire}>{s.label}</Button>)}
      </div>
    </div>
  );
}
