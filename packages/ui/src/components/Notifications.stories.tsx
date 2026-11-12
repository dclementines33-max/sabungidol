import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Banner } from "./Banner";
import { BlockerDialog } from "./BlockerDialog";
import { Button } from "./Button";
import { ErrorPanel } from "./ErrorPanel";
import { NotificationCenter } from "./NotificationCenter";
import type { Notice } from "./notice";
import { Toasts } from "./Toasts";

const meta: Meta = { title: "Notifications/All levels" };
export default meta;

const n = (id: string, level: Notice["level"], message: string, minute: number): Notice =>
  ({ id, level, message, at: `2026-11-12T10:${String(minute).padStart(2, "0")}:00Z` });

const history = [
  n("1", "info", "Matchday 12 selesai di 13 liga", 1),
  n("2", "success", "240 idol ditambahkan", 2),
  n("3", "warning", "Mina ada di Liga D1-A dan D2-C", 3),
  n("4", "blocker", "Start New Season diblokir: Nugu Cup belum selesai (R6)", 4),
  { ...n("5", "error", "Grup H hanya 3 idol", 5), code: "E-DRAW-002" },
];

function AllLevels() {
  const [toasts, setToasts] = useState<Notice[]>([history[0], { ...history[1], undo: () => {} }]);
  const [blocker, setBlocker] = useState<Notice | null>(null);
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex justify-end"><NotificationCenter notices={history} unread={3} onExport={() => {}} /></div>
      <Banner notice={history[2]} action={<Button className="px-2 py-1">Perbaiki</Button>} />
      <ErrorPanel code="E-DRAW-002" message="Grup H hanya 3 idol" context="Unzure Cup · group draw" report="E-DRAW-002" onRetry={() => {}} />
      <div className="flex gap-2">
        <Button onClick={() => setToasts([...toasts, { ...history[0], id: String(Date.now()) }])}>Tampilkan toast</Button>
        <Button onClick={() => setBlocker(history[3])}>Tampilkan blocker</Button>
      </div>
      <Toasts notices={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      <BlockerDialog notice={blocker} onClose={() => setBlocker(null)} />
    </div>
  );
}

export const Overview: StoryObj = { render: () => <AllLevels /> };
