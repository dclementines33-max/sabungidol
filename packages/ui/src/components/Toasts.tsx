// Info and success toasts (PRD §14.1): bottom corner, gone after 4 s; success can offer Undo.
import { useEffect } from "react";
import { Button } from "./Button";
import { LEVEL, type Notice } from "./notice";

export const TOAST_MS = 4000;

function Toast({ notice, onDismiss }: { notice: Notice; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notice.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [notice.id, onDismiss]);
  const { color, icon: Icon } = LEVEL[notice.level];
  return (
    <div role="status" className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm shadow-lg">
      <Icon aria-hidden="true" size={18} strokeWidth={1.5} className={color} />
      <span className="flex-1">{notice.message}</span>
      {notice.undo && (
        <Button
          className="px-2 py-1"
          onClick={() => {
            notice.undo?.();
            onDismiss(notice.id);
          }}
        >
          Undo
        </Button>
      )}
    </div>
  );
}

// Only info and success become toasts; the other levels have their own place.
export function Toasts({ notices, onDismiss }: { notices: Notice[]; onDismiss: (id: string) => void }) {
  const toasts = notices.filter((n) => n.level === "info" || n.level === "success");
  return (
    <div aria-live="polite" className="fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100%-32px))] flex-col gap-2">
      {toasts.map((n) => <Toast key={n.id} notice={n} onDismiss={onDismiss} />)}
    </div>
  );
}
